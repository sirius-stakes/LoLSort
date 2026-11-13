import type { ChampionProfile } from '../types/champion'
import type {
  EffectCategory,
  EffectDetail,
  SkillItem,
  SkillKey,
  TargetType,
} from '../types/skill'

/* ------------------------------------------------------------------ */
/* 重み定義                                                            */
/* ------------------------------------------------------------------ */

/**
 * 効果タグの重要度。
 * - ハードCC: +4
 * - 特殊バフ/デバフ: +2.5
 * - 基本効果: +1
 * 表にない効果は基本効果として +1 で扱う。
 */
export const EFFECT_MATCH_WEIGHTS: Record<string, number> = {
  // ハードCC（高重要度）
  suppression: 4,
  knockup: 4,
  knockback: 4,
  charm: 4,
  taunt: 4,
  snare: 4,
  stun: 4,
  fear: 4,
  sleep: 4,
  polymorph: 4,

  // 特殊バフ/デバフ（中重要度）
  shield: 2.5,
  invulnerable: 2.5,
  cc_immunity: 2.5,
  silence: 2.5,
  armor_shred: 2.5,
  magic_shred: 2.5,
  grievous: 2.5,

  // 基本効果（通常重要度）
  slow: 1,
  haste: 1,
  attack_speed: 1,
}

export const DEFAULT_EFFECT_WEIGHT = 1

/** 同一キーに同一カテゴリの効果がある場合のボーナス */
export const KEY_PLACEMENT_BONUS = 1.5

/** 主力CCの発動タイプが一致した場合のボーナス */
export const TARGET_TYPE_BONUS = 1

const COMPARE_KEYS: SkillKey[] = ['Q', 'W', 'E', 'R']

export const CATEGORY_LABELS: Record<EffectCategory, string> = {
  hard_cc: 'ハードCC',
  soft_cc: 'ソフトCC',
  buff: 'バフ',
  debuff: 'デバフ',
}

export const TARGET_TYPE_LABELS: Record<TargetType, string> = {
  point_and_click: '対象指定',
  skillshot: 'スキルショット',
  aoe: '範囲',
  self: '自身',
}

/* ------------------------------------------------------------------ */
/* 型                                                                  */
/* ------------------------------------------------------------------ */

export interface MatchedEffect {
  id: string
  label: string
  category: EffectCategory
  weight: number
}

export interface KeyMatch {
  key: SkillKey
  categories: EffectCategory[]
  baseSkill: SkillItem
  candidateSkill: SkillItem
}

export interface TargetTypeMatch {
  matched: boolean
  baseTargetType: TargetType | null
  candidateTargetType: TargetType | null
}

export interface SimilarityResult {
  champion: ChampionProfile
  /** 100点満点換算の類似度 */
  score: number
  /** 共通効果 / 全効果種類 */
  jaccard: number
  /** 共通効果タグの重み合計 */
  weightedMatch: number
  /** キー配置一致ボーナス */
  keyBonus: number
  /** 発動タイプ一致ボーナス */
  targetTypeBonus: number
  matchedEffects: MatchedEffect[]
  keyMatches: KeyMatch[]
  targetTypeMatch: TargetTypeMatch
  /** 「操作感の共通点」要約 */
  operationNotes: string[]
}

/* ------------------------------------------------------------------ */
/* ヘルパー                                                            */
/* ------------------------------------------------------------------ */

export function getEffectWeight(effect: EffectDetail): number {
  return EFFECT_MATCH_WEIGHTS[effect.id] ?? DEFAULT_EFFECT_WEIGHT
}

function collectUniqueEffects(champion: ChampionProfile): Map<string, EffectDetail> {
  const effects = new Map<string, EffectDetail>()

  for (const skill of champion.skills) {
    for (const effect of skill.effects) {
      if (!effects.has(effect.id)) effects.set(effect.id, effect)
    }
  }

  return effects
}

function findSkill(champion: ChampionProfile, key: SkillKey): SkillItem | undefined {
  return champion.skills.find((skill) => skill.key === key)
}

/**
 * チャンピオンの「主力CC」スキルを返す。
 * Q → W → E → R → P の順で最初に見つかったハードCCを優先し、
 * なければ同順でソフトCCを返す。
 */
export function findPrimaryCcSkill(champion: ChampionProfile): SkillItem | null {
  const keyOrder: SkillKey[] = ['Q', 'W', 'E', 'R', 'P']

  for (const key of keyOrder) {
    const skill = findSkill(champion, key)
    if (skill?.effects.some((effect) => effect.category === 'hard_cc')) {
      return skill
    }
  }

  for (const key of keyOrder) {
    const skill = findSkill(champion, key)
    if (skill?.effects.some((effect) => effect.category === 'soft_cc')) {
      return skill
    }
  }

  return null
}

function buildOperationNotes(
  keyMatches: KeyMatch[],
  targetTypeMatch: TargetTypeMatch,
  matchedEffects: MatchedEffect[],
): string[] {
  const notes: string[] = []

  for (const match of keyMatches.slice(0, 2)) {
    const categoryText = match.categories
      .map((category) => CATEGORY_LABELS[category])
      .join('・')
    const sameTargetType =
      match.baseSkill.targetType === match.candidateSkill.targetType

    notes.push(
      sameTargetType
        ? `${match.key}はどちらも${TARGET_TYPE_LABELS[match.baseSkill.targetType]}の${categoryText}`
        : `${match.key}の${categoryText}配置が一致`,
    )
  }

  if (
    targetTypeMatch.matched &&
    targetTypeMatch.baseTargetType &&
    targetTypeMatch.candidateTargetType
  ) {
    notes.push(
      `主力CCの発動形式が一致（${TARGET_TYPE_LABELS[targetTypeMatch.baseTargetType]}）`,
    )
  }

  const sharedHardCc = matchedEffects.filter(
    (effect) => effect.category === 'hard_cc',
  )

  if (sharedHardCc.length > 0) {
    notes.push(
      `共通ハードCC: ${sharedHardCc
        .slice(0, 3)
        .map((effect) => effect.label)
        .join('・')}`,
    )
  } else if (matchedEffects.length > 0) {
    notes.push(
      `共通効果: ${matchedEffects
        .slice(0, 4)
        .map((effect) => effect.label)
        .join('・')}`,
    )
  }

  if (notes.length === 0) {
    notes.push('共通する効果タグは少ない')
  }

  return notes
}

/* ------------------------------------------------------------------ */
/* 類似度計算                                                          */
/* ------------------------------------------------------------------ */

/**
 * 2体のチャンピオンデータから類似度を計算する。
 *
 * スコア = (共通効果の重み合計 + キー配置ボーナス + 発動タイプボーナス)
 *          × Jaccard係数
 * を、基準チャンピオンで理論上到達できる最大値に対する100点満点に換算する。
 */
export function calculateChampionSimilarity(
  base: ChampionProfile,
  candidate: ChampionProfile,
): SimilarityResult {
  const baseEffects = collectUniqueEffects(base)
  const candidateEffects = collectUniqueEffects(candidate)

  const matchedEffects: MatchedEffect[] = []

  for (const [id, effect] of baseEffects) {
    if (!candidateEffects.has(id)) continue
    matchedEffects.push({
      id,
      label: effect.label,
      category: effect.category,
      weight: getEffectWeight(effect),
    })
  }

  matchedEffects.sort(
    (a, b) => b.weight - a.weight || a.label.localeCompare(b.label, 'ja'),
  )

  const weightedMatch = matchedEffects.reduce(
    (total, effect) => total + effect.weight,
    0,
  )

  const unionIds = new Set([
    ...baseEffects.keys(),
    ...candidateEffects.keys(),
  ])
  const jaccard = unionIds.size > 0 ? matchedEffects.length / unionIds.size : 0

  /* キー配置（マッスルメモリー） */
  const keyMatches: KeyMatch[] = []
  let keyBonus = 0

  for (const key of COMPARE_KEYS) {
    const baseSkill = findSkill(base, key)
    const candidateSkill = findSkill(candidate, key)
    if (!baseSkill || !candidateSkill) continue

    const baseCategories = new Set(
      baseSkill.effects.map((effect) => effect.category),
    )
    const sharedCategories = Array.from(
      new Set(candidateSkill.effects.map((effect) => effect.category)),
    ).filter((category) => baseCategories.has(category))

    if (sharedCategories.length === 0) continue

    keyBonus += KEY_PLACEMENT_BONUS
    keyMatches.push({
      key,
      categories: sharedCategories,
      baseSkill,
      candidateSkill,
    })
  }

  /* 主力CCの発動タイプ */
  const basePrimaryCc = findPrimaryCcSkill(base)
  const candidatePrimaryCc = findPrimaryCcSkill(candidate)
  const baseTargetType = basePrimaryCc?.targetType ?? null
  const candidateTargetType = candidatePrimaryCc?.targetType ?? null
  const directionalTypes: TargetType[] = ['point_and_click', 'skillshot']
  const targetTypeMatch: TargetTypeMatch = {
    matched:
      baseTargetType !== null &&
      baseTargetType === candidateTargetType &&
      directionalTypes.includes(baseTargetType),
    baseTargetType,
    candidateTargetType,
  }
  const targetTypeBonus = targetTypeMatch.matched ? TARGET_TYPE_BONUS : 0

  /* Jaccard 係数を掛けたうえで 100 点換算 */
  const baseWeightTotal = Array.from(baseEffects.values()).reduce(
    (total, effect) => total + getEffectWeight(effect),
    0,
  )
  const maxKeyBonus =
    COMPARE_KEYS.filter((key) => {
      const skill = findSkill(base, key)
      return Boolean(skill && skill.effects.length > 0)
    }).length * KEY_PLACEMENT_BONUS
  const maxTargetTypeBonus = basePrimaryCc ? TARGET_TYPE_BONUS : 0
  const maxRawScore = baseWeightTotal + maxKeyBonus + maxTargetTypeBonus

  const rawScore =
    (weightedMatch + keyBonus + targetTypeBonus) * jaccard
  const score =
    maxRawScore > 0
      ? Math.min(100, Math.max(0, Math.round((rawScore / maxRawScore) * 100)))
      : 0

  return {
    champion: candidate,
    score,
    jaccard,
    weightedMatch,
    keyBonus,
    targetTypeBonus,
    matchedEffects,
    keyMatches,
    targetTypeMatch,
    operationNotes: buildOperationNotes(
      keyMatches,
      targetTypeMatch,
      matchedEffects,
    ),
  }
}

/**
 * 基準チャンピオンに対して類似度の高い順に候補を返す。
 */
export function rankSimilarChampions(
  base: ChampionProfile,
  candidates: ChampionProfile[],
  limit = 5,
): SimilarityResult[] {
  return candidates
    .filter((candidate) => candidate.championKey !== base.championKey)
    .map((candidate) => calculateChampionSimilarity(base, candidate))
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.weightedMatch - a.weightedMatch ||
        b.jaccard - a.jaccard,
    )
    .slice(0, limit)
}
