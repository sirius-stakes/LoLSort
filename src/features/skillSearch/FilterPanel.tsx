import type { Lane } from '../../types/champion'
import type {
  EffectCategory,
  SkillKeyFilter,
  TargetTypeFilter,
} from '../../types/skill'
import { LANES } from '../../data/champions'
import { ResetIcon, SearchIcon, XIcon } from '../../components/Icons'
import {
  COMPOSITION_META,
  type CompositionType,
} from '../../utils/compositionClassifier'
import {
  DAMAGE_TYPE_META,
  DAMAGE_TYPE_ORDER,
  EFFECT_CATEGORY_META,
  EFFECT_CATEGORY_ORDER,
  NO_DAMAGE_META,
  SKILL_KEYS,
  SKILL_KEY_STYLES,
  TARGET_TYPE_META,
  TARGET_TYPE_ORDER,
} from './meta'
import type {
  CategoryMatchMode,
  DamageFilter,
  SkillFilters,
} from './useSkillFilters'

const COMPOSITION_ORDER: CompositionType[] = ['all_in', 'poke', 'counter']

interface FilterPanelProps {
  filters: SkillFilters
  categoryCounts: Record<EffectCategory, number>
  resultCount: number
  hasConditions: boolean
  onSearchChange: (value: string) => void
  onToggleCategory: (category: EffectCategory) => void
  onCategoryMatchModeChange: (mode: CategoryMatchMode) => void
  onSkillKeyChange: (key: SkillKeyFilter) => void
  onTargetTypeChange: (targetType: TargetTypeFilter) => void
  onToggleLane: (lane: Lane) => void
  onClearLanes: () => void
  onToggleComposition: (composition: CompositionType) => void
  onClearCompositions: () => void
  onToggleDamage: (damage: DamageFilter) => void
  onClearDamage: () => void
  onCleanseImmuneOnlyChange: (value: boolean) => void
  onQssRequiredOnlyChange: (value: boolean) => void
  onReset: () => void
}

function SectionTitle({ children, hint }: { children: string; hint?: string }) {
  return (
    <div className="mb-2 flex items-center justify-between gap-2">
      <h3 className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#C89B3C]">
        {children}
      </h3>
      {hint && <span className="text-[9px] text-[#A09B8C]/60">{hint}</span>}
    </div>
  )
}

function FilterCheckbox({
  checked,
  onChange,
  label,
  description,
  tone,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  description: string
  tone: 'red' | 'gold'
}) {
  const accent = tone === 'red' ? 'accent-[#E0645A]' : 'accent-[#E8B84B]'

  return (
    <label
      className={`flex cursor-pointer items-start gap-2.5 rounded-lg border px-2.5 py-2 transition ${
        checked
          ? tone === 'red'
            ? 'border-[#E0645A]/60 bg-[#E0645A]/10'
            : 'border-[#E8B84B]/60 bg-[#E8B84B]/10'
          : 'border-[#785A28]/35 bg-[#010A13]/50 hover:border-[#C89B3C]/45'
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className={`mt-0.5 h-3.5 w-3.5 shrink-0 rounded border-[#785A28] bg-[#010A13] ${accent}`}
      />
      <span className="min-w-0">
        <span
          className={`block text-[11px] font-semibold ${
            checked
              ? tone === 'red'
                ? 'text-[#FFB9AE]'
                : 'text-[#F5D793]'
              : 'text-[#F0E6D2]'
          }`}
        >
          {label}
        </span>
        <span className="mt-0.5 block text-[9px] leading-snug text-[#A09B8C]/75">
          {description}
        </span>
      </span>
    </label>
  )
}

export function FilterPanel({
  filters,
  categoryCounts,
  resultCount,
  hasConditions,
  onSearchChange,
  onToggleCategory,
  onCategoryMatchModeChange,
  onSkillKeyChange,
  onTargetTypeChange,
  onToggleLane,
  onClearLanes,
  onToggleComposition,
  onClearCompositions,
  onToggleDamage,
  onClearDamage,
  onCleanseImmuneOnlyChange,
  onQssRequiredOnlyChange,
  onReset,
}: FilterPanelProps) {
  return (
    <div className="space-y-5">
      <div>
        <SectionTitle hint="リアルタイム">フリーワード検索</SectionTitle>
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#C89B3C]/80" />
          <input
            type="text"
            value={filters.search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="チャンピオン名、スキル名で検索..."
            aria-label="チャンピオン名、スキル名で検索"
            className="w-full rounded-lg border border-[#785A28]/50 bg-[#010A13]/80 py-2.5 pl-9 pr-9 text-xs text-[#F0E6D2] placeholder:text-[#A09B8C]/50 focus:border-[#C89B3C]/80 focus:outline-none focus:ring-1 focus:ring-[#C89B3C]/30"
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label="検索語をクリア"
              className="absolute right-2 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded text-[#A09B8C] transition hover:bg-[#C89B3C]/10 hover:text-[#F0E6D2]"
            >
              <XIcon className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      <div>
        <SectionTitle hint="複数選択可">効果種別</SectionTitle>

        <div
          role="group"
          aria-label="効果種別の検索モード"
          className="mb-2 grid grid-cols-2 gap-1 rounded-lg border border-[#785A28]/40 bg-[#010A13]/70 p-1"
        >
          {(['OR', 'AND'] as const).map((mode) => {
            const active = filters.categoryMatchMode === mode

            return (
              <button
                key={mode}
                type="button"
                aria-pressed={active}
                aria-label={
                  mode === 'AND'
                    ? 'AND検索（すべて含む）'
                    : 'OR検索（いずれかを含む）'
                }
                onClick={() => onCategoryMatchModeChange(mode)}
                className={`rounded-md px-1.5 py-1.5 text-[10px] font-bold transition ${
                  active
                    ? 'bg-[#C89B3C] text-[#091428] shadow-[0_0_10px_rgba(200,155,60,0.35)]'
                    : 'text-[#A09B8C] hover:bg-[#C89B3C]/10 hover:text-[#F0E6D2]'
                }`}
              >
                {mode}検索
                <span
                  className={`ml-0.5 text-[8px] font-normal ${
                    active ? 'text-[#091428]/75' : 'opacity-70'
                  }`}
                >
                  （{mode === 'AND' ? 'すべて含む' : 'いずれかを含む'}）
                </span>
              </button>
            )
          })}
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          {EFFECT_CATEGORY_ORDER.map((category) => {
            const meta = EFFECT_CATEGORY_META[category]
            const active = filters.categories.includes(category)

            return (
              <button
                key={category}
                type="button"
                aria-pressed={active}
                onClick={() => onToggleCategory(category)}
                title={`${meta.description} — ${categoryCounts[category]} スキル`}
                className={`flex items-center gap-1.5 rounded-lg border px-2 py-2 text-left text-[11px] font-semibold transition ${
                  active
                    ? meta.active
                    : 'border-[#3A3A3A]/80 bg-[#010A13]/60 text-[#A09B8C] hover:border-[#C89B3C]/50 hover:text-[#F0E6D2]'
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                    active ? meta.dot : 'bg-[#5A5A5A]'
                  }`}
                />
                <span className="truncate">{meta.label}</span>
                <span className="ml-auto text-[9px] font-normal tabular-nums opacity-60">
                  {categoryCounts[category]}
                </span>
              </button>
            )
          })}
        </div>
        <p className="mt-1.5 text-[9px] leading-relaxed text-[#A09B8C]/65">
          {filters.categoryMatchMode === 'AND'
            ? '選択した種別をすべて含むスキルに絞り込みます。'
            : '選択した種別のいずれかを含むスキルに絞り込みます。'}
        </p>
      </div>

      <div>
        <SectionTitle hint="スキル枠">スキルキー</SectionTitle>
        <div className="grid grid-cols-6 gap-1">
          <button
            type="button"
            aria-pressed={filters.skillKey === 'ALL'}
            onClick={() => onSkillKeyChange('ALL')}
            className={`rounded-md border px-1 py-1.5 text-[10px] font-bold transition ${
              filters.skillKey === 'ALL'
                ? 'border-[#C89B3C]/70 bg-[#C89B3C]/20 text-[#F5D793]'
                : 'border-[#3A3A3A]/80 bg-[#010A13]/60 text-[#A09B8C] hover:border-[#C89B3C]/50 hover:text-[#F0E6D2]'
            }`}
          >
            All
          </button>
          {SKILL_KEYS.map((key) => {
            const active = filters.skillKey === key
            return (
              <button
                key={key}
                type="button"
                aria-pressed={active}
                onClick={() => onSkillKeyChange(key)}
                title={key === 'P' ? 'Passive' : `スキル ${key}`}
                className={`rounded-md border px-1 py-1.5 text-[11px] font-bold transition ${
                  active
                    ? SKILL_KEY_STYLES[key]
                    : 'border-[#3A3A3A]/80 bg-[#010A13]/60 text-[#A09B8C] hover:border-[#C89B3C]/50 hover:text-[#F0E6D2]'
                }`}
              >
                {key}
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <SectionTitle hint="発動方法">発動タイプ</SectionTitle>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            aria-pressed={filters.targetType === 'ALL'}
            onClick={() => onTargetTypeChange('ALL')}
            className={`rounded-md border px-2 py-1.5 text-[10px] font-semibold transition ${
              filters.targetType === 'ALL'
                ? 'border-[#C89B3C]/70 bg-[#C89B3C]/20 text-[#F5D793]'
                : 'border-[#3A3A3A]/80 bg-[#010A13]/60 text-[#A09B8C] hover:border-[#C89B3C]/50 hover:text-[#F0E6D2]'
            }`}
          >
            全て
          </button>
          {TARGET_TYPE_ORDER.map((targetType) => {
            const meta = TARGET_TYPE_META[targetType]
            const active = filters.targetType === targetType

            return (
              <button
                key={targetType}
                type="button"
                aria-pressed={active}
                onClick={() => onTargetTypeChange(targetType)}
                title={meta.description}
                className={`rounded-md border px-2 py-1.5 text-[10px] font-semibold transition ${
                  active
                    ? meta.active
                    : 'border-[#3A3A3A]/80 bg-[#010A13]/60 text-[#A09B8C] hover:border-[#C89B3C]/50 hover:text-[#F0E6D2]'
                }`}
              >
                {meta.filterLabel}
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <SectionTitle hint="複数選択可">レーン</SectionTitle>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            aria-pressed={filters.lanes.length === 0}
            onClick={onClearLanes}
            className={`rounded-md border px-2 py-1.5 text-[10px] font-semibold transition ${
              filters.lanes.length === 0
                ? 'border-[#C89B3C]/70 bg-[#C89B3C]/20 text-[#F5D793]'
                : 'border-[#3A3A3A]/80 bg-[#010A13]/60 text-[#A09B8C] hover:border-[#C89B3C]/50 hover:text-[#F0E6D2]'
            }`}
          >
            全て
          </button>
          {LANES.map((lane) => {
            const active = filters.lanes.includes(lane)

            return (
              <button
                key={lane}
                type="button"
                aria-pressed={active}
                onClick={() => onToggleLane(lane)}
                className={`rounded-md border px-2 py-1.5 text-[10px] font-semibold transition ${
                  active
                    ? 'border-[#C89B3C]/70 bg-[#C89B3C]/20 text-[#F5D793]'
                    : 'border-[#3A3A3A]/80 bg-[#010A13]/60 text-[#A09B8C] hover:border-[#C89B3C]/50 hover:text-[#F0E6D2]'
                }`}
              >
                {lane}
              </button>
            )
          })}
        </div>
        <p className="mt-1.5 text-[9px] leading-relaxed text-[#A09B8C]/65">
          選択したレーンで使用されるチャンピオンのスキルに絞り込みます。
        </p>
      </div>

      <div>
        <SectionTitle hint="複数選択可">戦術タイプ</SectionTitle>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            aria-pressed={filters.compositions.length === 0}
            onClick={onClearCompositions}
            className={`rounded-md border px-2 py-1.5 text-[10px] font-semibold transition ${
              filters.compositions.length === 0
                ? 'border-[#C89B3C]/70 bg-[#C89B3C]/20 text-[#F5D793]'
                : 'border-[#3A3A3A]/80 bg-[#010A13]/60 text-[#A09B8C] hover:border-[#C89B3C]/50 hover:text-[#F0E6D2]'
            }`}
          >
            全て
          </button>
          {COMPOSITION_ORDER.map((composition) => {
            const meta = COMPOSITION_META[composition]
            const active = filters.compositions.includes(composition)

            return (
              <button
                key={composition}
                type="button"
                aria-pressed={active}
                onClick={() => onToggleComposition(composition)}
                title={meta.description}
                className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1.5 text-[10px] font-semibold transition ${
                  active
                    ? 'border-[#C89B3C]/70 bg-[#C89B3C]/20 text-[#F5D793]'
                    : 'border-[#3A3A3A]/80 bg-[#010A13]/60 text-[#A09B8C] hover:border-[#C89B3C]/50 hover:text-[#F0E6D2]'
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                    active ? meta.dot : 'bg-[#5A5A5A]'
                  }`}
                />
                {meta.label}
              </button>
            )
          })}
        </div>
        <p className="mt-1.5 text-[9px] leading-relaxed text-[#A09B8C]/65">
          チャンピオンのスキル構成から判定した戦術タイプで絞り込みます。
        </p>
      </div>

      <div>
        <SectionTitle hint="複数選択可">ダメージ属性</SectionTitle>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            aria-pressed={filters.damageFilters.length === 0}
            onClick={onClearDamage}
            className={`rounded-md border px-2 py-1.5 text-[10px] font-semibold transition ${
              filters.damageFilters.length === 0
                ? 'border-[#C89B3C]/70 bg-[#C89B3C]/20 text-[#F5D793]'
                : 'border-[#3A3A3A]/80 bg-[#010A13]/60 text-[#A09B8C] hover:border-[#C89B3C]/50 hover:text-[#F0E6D2]'
            }`}
          >
            全て
          </button>
          {DAMAGE_TYPE_ORDER.map((type) => {
            const meta = DAMAGE_TYPE_META[type]
            const active = filters.damageFilters.includes(type)

            return (
              <button
                key={type}
                type="button"
                aria-pressed={active}
                onClick={() => onToggleDamage(type)}
                title={meta.description}
                className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1.5 text-[10px] font-semibold transition ${
                  active
                    ? meta.active
                    : 'border-[#3A3A3A]/80 bg-[#010A13]/60 text-[#A09B8C] hover:border-[#C89B3C]/50 hover:text-[#F0E6D2]'
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                    active ? meta.dot : 'bg-[#5A5A5A]'
                  }`}
                />
                {meta.filterLabel}
              </button>
            )
          })}
          <button
            type="button"
            aria-pressed={filters.damageFilters.includes('none')}
            onClick={() => onToggleDamage('none')}
            title={NO_DAMAGE_META.description}
            className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1.5 text-[10px] font-semibold transition ${
              filters.damageFilters.includes('none')
                ? NO_DAMAGE_META.active
                : 'border-[#3A3A3A]/80 bg-[#010A13]/60 text-[#A09B8C] hover:border-[#C89B3C]/50 hover:text-[#F0E6D2]'
            }`}
          >
            <span
              className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                filters.damageFilters.includes('none')
                  ? NO_DAMAGE_META.dot
                  : 'bg-[#5A5A5A]'
              }`}
            />
            {NO_DAMAGE_META.label}
          </button>
        </div>
        <p className="mt-1.5 text-[9px] leading-relaxed text-[#A09B8C]/65">
          選択した属性のいずれかを持つスキルに絞り込みます。
        </p>
      </div>

      <div>
        <SectionTitle hint="チェックで絞り込み">解除耐性</SectionTitle>
        <div className="space-y-1.5">
          <FilterCheckbox
            checked={filters.cleanseImmuneOnly}
            onChange={onCleanseImmuneOnlyChange}
            label="クレンズ無効のみ"
            description="サモナースペル「クレンズ」で解除できない効果を持つスキル"
            tone="red"
          />
          <FilterCheckbox
            checked={filters.qssRequiredOnly}
            onChange={onQssRequiredOnlyChange}
            label="QSS必須のみ"
            description="クレンズでは解除できず、QSSでのみ解除できるスキル"
            tone="gold"
          />
        </div>
      </div>

      <div className="space-y-3 border-t border-[#785A28]/25 pt-4">
        <div className="flex items-center justify-between gap-2 rounded-lg border border-[#785A28]/40 bg-[#010A13]/60 px-3 py-2.5">
          <div className="flex items-center gap-2">
            <span className="grid h-6 min-w-6 place-items-center rounded-full bg-[#C89B3C]/20 px-1 text-[11px] font-bold tabular-nums text-[#F5D793]">
              {resultCount}
            </span>
            <span className="text-[10px] text-[#A09B8C]">ヒット中</span>
          </div>
          <button
            type="button"
            onClick={onReset}
            disabled={!hasConditions}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#C89B3C] underline decoration-[#C89B3C]/40 underline-offset-4 transition hover:text-[#F0E6D2] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ResetIcon className="h-3 w-3" />
            条件をクリア
          </button>
        </div>
      </div>
    </div>
  )
}
