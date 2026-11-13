import type { EffectDetail, SkillItem, SkillKey } from '../types/skill'

/* ------------------------------------------------------------------ */
/* CC 判定                                                             */
/* ------------------------------------------------------------------ */

const KEY_ORDER: Record<SkillKey, number> = { P: 0, Q: 1, W: 2, E: 3, R: 4 }

/** 完全解除不能（クレンズ / QSS 対象外）の CC 効果 */
export const UNCLEANSABLE_CC_IDS = ['knockup', 'knockback'] as const

export function hasEffect(skill: SkillItem, effectId: string): boolean {
  return skill.effects.some((effect) => effect.id === effectId)
}

export function isUncleansableCc(skill: SkillItem): boolean {
  return skill.effects.some(
    (effect) =>
      effect.category === 'hard_cc' &&
      (UNCLEANSABLE_CC_IDS as readonly string[]).includes(effect.id),
  )
}

/**
 * CCチェイン計算機で使用する「代表 CC 効果」を返す。
 * ハードCCを優先し、同カテゴリ内では効果時間が長いものを採用する。
 */
export function getPrimaryCcEffect(skill: SkillItem): EffectDetail | null {
  const hard = skill.effects.filter(
    (effect) => effect.category === 'hard_cc' && (effect.duration ?? 0) > 0,
  )
  const soft = skill.effects.filter(
    (effect) => effect.category === 'soft_cc' && (effect.duration ?? 0) > 0,
  )
  const pool = hard.length > 0 ? hard : soft
  if (pool.length === 0) return null

  return pool.reduce((best, effect) =>
    (effect.duration ?? 0) > (best.duration ?? 0) ? effect : best,
  )
}

/** CC効果を持つスキルを P → Q → W → E → R 順で返す */
export function getCcSkills(skills: SkillItem[]): SkillItem[] {
  return skills
    .filter((skill) => getPrimaryCcEffect(skill) !== null)
    .sort((a, b) => KEY_ORDER[a.key] - KEY_ORDER[b.key])
}

/* ------------------------------------------------------------------ */
/* 数値抽出                                                            */
/* ------------------------------------------------------------------ */

/**
 * valueText から割合（%）を抽出し、最大値を返す。
 * 例: "80% → 40%" → 80 / "最大47%" → 47
 */
export function extractPercent(valueText?: string): number | null {
  if (!valueText) return null

  const matches = valueText.match(/(\d+(?:\.\d+)?)\s*%/g)
  if (!matches) return null

  const values = matches
    .map((match) => Number.parseFloat(match.replace('%', '').trim()))
    .filter((value) => Number.isFinite(value))

  return values.length > 0 ? Math.max(...values) : null
}

export function formatSeconds(seconds: number): string {
  return `${seconds.toFixed(1)} 秒`
}

/* ------------------------------------------------------------------ */
/* ランキング                                                          */
/* ------------------------------------------------------------------ */

export type RankingMetric =
  | 'hard_cc'
  | 'slow'
  | 'defense_shred'
  | 'attack_speed_shred'

export interface RankingEntry {
  skill: SkillItem
  /** ランキング対象の効果ラベル */
  effectLabel: string
  /** 数値（秒 or %） */
  value: number
  /** 大きく表示する値テキスト */
  displayValue: string
  /** 秒数（補足表示用） */
  duration?: number
  /** 補足テキスト */
  note: string
}

export const RANKING_METRICS: Array<{
  id: RankingMetric
  label: string
  description: string
  unit: string
}> = [
  {
    id: 'hard_cc',
    label: '最長ハードCC時間',
    description: 'スネア・スタン・サプレッションなどの拘束秒数',
    unit: '秒',
  },
  {
    id: 'slow',
    label: '最高スロー率',
    description: '移動速度低下率（%）が高いスキル',
    unit: '%',
  },
  {
    id: 'defense_shred',
    label: '防御低下（AR / MR削減）',
    description: '物理防御・魔法防御を下げるスキル',
    unit: '%',
  },
  {
    id: 'attack_speed_shred',
    label: '攻撃速度（AS）低下',
    description: 'マークスマン・アサシン対策になるAS低下',
    unit: '%',
  },
]

const CC_BADGE_PRIORITY = ['suppression', 'stun', 'snare', 'knockup', 'knockback', 'charm', 'taunt', 'fear', 'sleep', 'polymorph']

/**
 * 「最長ハードCC時間」ランキングで採用できる効果 ID。
 * category が hard_cc であっても、スロー等のソフトCCが混入しないよう
 * ID レベルでも明示的に許可リストで検証する。
 */
const HARD_CC_EFFECT_IDS = new Set(CC_BADGE_PRIORITY)

/**
 * スキルからランキング対象のハードCC効果のみを抽出する。
 * soft_cc / buff / debuff の duration は一切参照しない。
 */
export function getHardCcEffects(skill: SkillItem): EffectDetail[] {
  return skill.effects.filter(
    (effect) =>
      effect.category === 'hard_cc' &&
      HARD_CC_EFFECT_IDS.has(effect.id) &&
      (effect.duration ?? 0) > 0,
  )
}

function pickHardCcEffect(skill: SkillItem): EffectDetail | null {
  const effects = getHardCcEffects(skill)
  if (effects.length === 0) return null

  return effects.reduce((best, effect) => {
    const diff = (effect.duration ?? 0) - (best.duration ?? 0)
    if (diff !== 0) return diff > 0 ? effect : best

    const bestPriority = CC_BADGE_PRIORITY.indexOf(best.id)
    const effectPriority = CC_BADGE_PRIORITY.indexOf(effect.id)
    return effectPriority >= 0 && (bestPriority < 0 || effectPriority < bestPriority)
      ? effect
      : best
  })
}

function buildEntry(
  skill: SkillItem,
  metric: RankingMetric,
): RankingEntry | null {
  if (metric === 'hard_cc') {
    const effect = pickHardCcEffect(skill)
    if (!effect) return null

    return {
      skill,
      effectLabel: effect.label,
      value: effect.duration ?? 0,
      displayValue: formatSeconds(effect.duration ?? 0),
      duration: effect.duration,
      note: effect.valueText ?? effect.label,
    }
  }

  if (metric === 'slow') {
    const effect = skill.effects.find(
      (item) => item.id === 'slow' && extractPercent(item.valueText) !== null,
    )
    if (!effect) return null

    const percent = extractPercent(effect.valueText) ?? 0

    return {
      skill,
      effectLabel: effect.label,
      value: percent,
      displayValue: `${percent}%`,
      duration: effect.duration,
      note: effect.duration ? `${effect.duration.toFixed(1)}秒間` : (effect.valueText ?? ''),
    }
  }

  if (metric === 'defense_shred') {
    const shreds = skill.effects.filter(
      (effect) =>
        (effect.id === 'armor_shred' || effect.id === 'magic_shred') &&
        extractPercent(effect.valueText) !== null,
    )
    if (shreds.length === 0) return null

    const percents = shreds.map(
      (effect) => extractPercent(effect.valueText) ?? 0,
    )
    const value = Math.max(...percents)
    const hasArmor = shreds.some((effect) => effect.id === 'armor_shred')
    const hasMagic = shreds.some((effect) => effect.id === 'magic_shred')
    const defenseLabel =
      hasArmor && hasMagic ? '物理・魔法防御' : hasArmor ? '物理防御' : '魔法防御'
    const duration = Math.max(
      0,
      ...shreds.map((effect) => effect.duration ?? 0),
    )

    return {
      skill,
      effectLabel: `${defenseLabel}低下`,
      value,
      displayValue: `${value}% 削減`,
      duration: duration > 0 ? duration : undefined,
      note:
        duration > 0
          ? `${duration.toFixed(1)}秒間 ${defenseLabel} ${value}% 低下`
          : `${defenseLabel} ${value}% 低下`,
    }
  }

  const effect = skill.effects.find(
    (item) =>
      item.id === 'attack_speed_shred' &&
      extractPercent(item.valueText) !== null,
  )
  if (!effect) return null

  const percent = extractPercent(effect.valueText) ?? 0

  return {
    skill,
    effectLabel: effect.label,
    value: percent,
    displayValue: `${percent}% 低下`,
    duration: effect.duration,
    note: effect.duration
      ? `${effect.duration.toFixed(1)}秒間 攻撃速度 ${percent}% 低下`
      : `攻撃速度 ${percent}% 低下`,
  }
}

/** 指定指標のランキングを降順で返す */
export function buildEffectRanking(
  skills: SkillItem[],
  metric: RankingMetric,
  limit = 10,
): RankingEntry[] {
  return skills
    .map((skill) => buildEntry(skill, metric))
    .filter((entry): entry is RankingEntry => entry !== null)
    .sort(
      (a, b) =>
        b.value - a.value ||
        (b.duration ?? 0) - (a.duration ?? 0) ||
        a.skill.championName.localeCompare(b.skill.championName, 'ja'),
    )
    .slice(0, limit)
}
