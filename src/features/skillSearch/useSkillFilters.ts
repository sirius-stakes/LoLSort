import { useCallback, useMemo, useState } from 'react'
import { ALL_SKILLS, CHAMPION_BY_KEY } from '../../data/champions'
import type { Lane } from '../../types/champion'
import type {
  DamageType,
  EffectCategory,
  SkillKeyFilter,
  SkillItem,
  TargetTypeFilter,
} from '../../types/skill'
import {
  classifyChampionComposition,
  type CompositionType,
} from '../../utils/compositionClassifier'

/** ダメージ属性フィルター。'none' はダメージなしを表す。 */
export type DamageFilter = DamageType | 'none'

/** 複数の効果種別を選択したときの検索条件 */
export type CategoryMatchMode = 'OR' | 'AND'

export interface SkillFilters {
  search: string
  categories: EffectCategory[]
  /** 効果種別の一致条件。OR: いずれか / AND: すべて */
  categoryMatchMode: CategoryMatchMode
  skillKey: SkillKeyFilter
  targetType: TargetTypeFilter
  lanes: Lane[]
  compositions: CompositionType[]
  damageFilters: DamageFilter[]
  cleanseImmuneOnly: boolean
  qssRequiredOnly: boolean
}

const INITIAL_FILTERS: SkillFilters = {
  search: '',
  categories: [],
  categoryMatchMode: 'OR',
  skillKey: 'ALL',
  targetType: 'ALL',
  lanes: [],
  compositions: [],
  damageFilters: [],
  cleanseImmuneOnly: false,
  qssRequiredOnly: false,
}

function buildSearchHaystack(skill: SkillItem): string {
  return [
    skill.championName,
    skill.championKey,
    skill.name,
    skill.description,
    ...skill.championRole,
    ...skill.effects.flatMap((effect) => [effect.label, effect.valueText ?? '']),
  ]
    .join(' ')
    .toLowerCase()
}

/**
 * 全スキル分の検索文字列を起動時に一度だけ生成しておく。
 * 検索のたびに 865 件の文字列連結を行うコストを避ける。
 */
const SEARCH_HAYSTACK = new Map<string, string>(
  ALL_SKILLS.map((skill) => [skill.id, buildSearchHaystack(skill)]),
)

function getSearchHaystack(skill: SkillItem): string {
  return SEARCH_HAYSTACK.get(skill.id) ?? buildSearchHaystack(skill)
}

/**
 * 選択中の効果種別に対する一致判定。
 * OR: 選択した種別のいずれかを持つ / AND: 選択した種別をすべて持つ。
 *
 * 比較対象は effect.category（EffectCategory）で統一している。
 * effect.id / effect.label ではない点に注意。
 */
function matchesCategorySelection(
  skillEffects: SkillItem['effects'],
  selectedCategories: EffectCategory[],
  matchMode: CategoryMatchMode,
): boolean {
  const presentCategories = new Set(
    skillEffects.map((effect) => effect.category),
  )

  return matchMode === 'AND'
    ? selectedCategories.every((category) => presentCategories.has(category))
    : selectedCategories.some((category) => presentCategories.has(category))
}

export function useSkillFilters(skills: SkillItem[] = ALL_SKILLS) {
  const [filters, setFilters] = useState<SkillFilters>(INITIAL_FILTERS)

  const setSearch = useCallback((search: string) => {
    setFilters((current) => ({ ...current, search }))
  }, [])

  const toggleCategory = useCallback((category: EffectCategory) => {
    setFilters((current) => ({
      ...current,
      categories: current.categories.includes(category)
        ? current.categories.filter((item) => item !== category)
        : [...current.categories, category],
    }))
  }, [])

  const setCategoryMatchMode = useCallback(
    (categoryMatchMode: CategoryMatchMode) => {
      setFilters((current) => ({ ...current, categoryMatchMode }))
    },
    [],
  )

  const setSkillKey = useCallback((skillKey: SkillKeyFilter) => {
    setFilters((current) => ({ ...current, skillKey }))
  }, [])

  const setTargetType = useCallback((targetType: TargetTypeFilter) => {
    setFilters((current) => ({ ...current, targetType }))
  }, [])

  const toggleLane = useCallback((lane: Lane) => {
    setFilters((current) => ({
      ...current,
      lanes: current.lanes.includes(lane)
        ? current.lanes.filter((item) => item !== lane)
        : [...current.lanes, lane],
    }))
  }, [])

  const setLanes = useCallback((lanes: Lane[]) => {
    setFilters((current) => ({ ...current, lanes }))
  }, [])

  const toggleComposition = useCallback((composition: CompositionType) => {
    setFilters((current) => ({
      ...current,
      compositions: current.compositions.includes(composition)
        ? current.compositions.filter((item) => item !== composition)
        : [...current.compositions, composition],
    }))
  }, [])

  const setCompositions = useCallback((compositions: CompositionType[]) => {
    setFilters((current) => ({ ...current, compositions }))
  }, [])

  const toggleDamageFilter = useCallback((damage: DamageFilter) => {
    setFilters((current) => ({
      ...current,
      damageFilters: current.damageFilters.includes(damage)
        ? current.damageFilters.filter((item) => item !== damage)
        : [...current.damageFilters, damage],
    }))
  }, [])

  const setDamageFilters = useCallback((damageFilters: DamageFilter[]) => {
    setFilters((current) => ({ ...current, damageFilters }))
  }, [])

  const setCleanseImmuneOnly = useCallback((cleanseImmuneOnly: boolean) => {
    setFilters((current) => ({ ...current, cleanseImmuneOnly }))
  }, [])

  const setQssRequiredOnly = useCallback((qssRequiredOnly: boolean) => {
    setFilters((current) => ({ ...current, qssRequiredOnly }))
  }, [])

  const resetFilters = useCallback(() => {
    setFilters(INITIAL_FILTERS)
  }, [])

  const categoryCounts = useMemo(() => {
    const counts: Record<EffectCategory, number> = {
      hard_cc: 0,
      soft_cc: 0,
      buff: 0,
      debuff: 0,
    }

    for (const skill of skills) {
      const present = new Set(skill.effects.map((effect) => effect.category))
      for (const category of present) counts[category] += 1
    }

    return counts
  }, [skills])

  const filtered = useMemo(() => {
    const query = filters.search.trim().toLowerCase()

    return skills.filter((skill) => {
      if (filters.skillKey !== 'ALL' && skill.key !== filters.skillKey) return false
      if (filters.targetType !== 'ALL' && skill.targetType !== filters.targetType) {
        return false
      }
      if (filters.cleanseImmuneOnly && skill.cleansable) return false
      if (filters.qssRequiredOnly && (skill.cleansable || !skill.qssCleanse)) {
        return false
      }

      const champion = CHAMPION_BY_KEY.get(skill.championKey)

      if (filters.lanes.length > 0) {
        const championLanes = champion?.lanes ?? []
        if (!filters.lanes.some((lane) => championLanes.includes(lane))) {
          return false
        }
      }

      if (filters.compositions.length > 0) {
        const championCompositions = champion
          ? classifyChampionComposition(champion)
          : []
        if (
          !filters.compositions.some((composition) =>
            championCompositions.includes(composition),
          )
        ) {
          return false
        }
      }

      if (filters.damageFilters.length > 0) {
        const includesNoDamage = filters.damageFilters.includes('none')
        const damageTypes = filters.damageFilters.filter(
          (type): type is DamageType => type !== 'none',
        )
        const matchesNoDamage =
          includesNoDamage && skill.damageTypes.length === 0
        const matchesDamageType = skill.damageTypes.some((type) =>
          damageTypes.includes(type),
        )

        if (!matchesNoDamage && !matchesDamageType) return false
      }

      if (
        filters.categories.length > 0 &&
        !matchesCategorySelection(
          skill.effects,
          filters.categories,
          filters.categoryMatchMode,
        )
      ) {
        return false
      }

      if (query) {
        const haystack = getSearchHaystack(skill)
        if (!haystack.includes(query)) return false
      }

      return true
    })
    // categoryMatchMode を明示的に依存配列へ含める。
    // filters 全体に依存すると将来の分割時に切り替えが反映されない事故を招くため、
    // 絞り込みに使用するフィールドをすべて列挙する。
  }, [
    skills,
    filters.search,
    filters.categories,
    filters.categoryMatchMode,
    filters.skillKey,
    filters.targetType,
    filters.lanes,
    filters.compositions,
    filters.damageFilters,
    filters.cleanseImmuneOnly,
    filters.qssRequiredOnly,
  ])

  const hasConditions =
    filters.search.trim().length > 0 ||
    filters.categories.length > 0 ||
    filters.skillKey !== 'ALL' ||
    filters.targetType !== 'ALL' ||
    filters.lanes.length > 0 ||
    filters.compositions.length > 0 ||
    filters.damageFilters.length > 0 ||
    filters.cleanseImmuneOnly ||
    filters.qssRequiredOnly

  const activeFilterCount =
    filters.categories.length +
    (filters.skillKey !== 'ALL' ? 1 : 0) +
    (filters.targetType !== 'ALL' ? 1 : 0) +
    filters.lanes.length +
    filters.compositions.length +
    filters.damageFilters.length +
    (filters.cleanseImmuneOnly ? 1 : 0) +
    (filters.qssRequiredOnly ? 1 : 0) +
    (filters.search.trim() ? 1 : 0)

  return {
    filters,
    filtered,
    categoryCounts,
    hasConditions,
    activeFilterCount,
    setSearch,
    toggleCategory,
    setCategoryMatchMode,
    setSkillKey,
    setTargetType,
    toggleLane,
    setLanes,
    toggleComposition,
    setCompositions,
    toggleDamageFilter,
    setDamageFilters,
    setCleanseImmuneOnly,
    setQssRequiredOnly,
    resetFilters,
  }
}
