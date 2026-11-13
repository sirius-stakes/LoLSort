import type { ChampionProfile } from '../types/champion'
import type { EffectDetail, SkillItem } from '../types/skill'

/** チーム編成・戦術タイプ */
export type CompositionType = 'all_in' | 'poke' | 'counter'

export interface CompositionMeta {
  label: string
  description: string
  /** 控えめな副情報バッジ */
  badge: string
  dot: string
}

export const COMPOSITION_META: Record<CompositionType, CompositionMeta> = {
  all_in: {
    label: 'オールイン',
    description: 'ハードCCと突進・近接エンゲージを兼ね備えた仕掛け型',
    badge: 'border-[#4A5568]/75 bg-[#182230]/85 text-[#B9C4CC]',
    dot: 'bg-[#E0645A]',
  },
  poke: {
    label: 'ポーク',
    description: 'スキルショットで遠距離から継続的に削る編成',
    badge: 'border-[#4A5568]/75 bg-[#182230]/85 text-[#B9C4CC]',
    dot: 'bg-[#5AB0E0]',
  },
  counter: {
    label: 'カウンター',
    description: 'シールド・回復・妨害で敵の仕掛けを受け流す編成',
    badge: 'border-[#4A5568]/75 bg-[#182230]/85 text-[#B9C4CC]',
    dot: 'bg-[#3FB68B]',
  },
}

/** 突進・ブリンク・近接エンゲージを示す語句 */
const MOBILITY_PATTERN =
  /ダッシュ|ブリンク|突撃|突進|跳躍|飛び込|飛びつ|頭突き|もとへ|接近|吶喊|突貫|エンゲージ/

/** ダメージスキル判定に使う語句 */
const DAMAGE_PATTERN = /ダメージ/

/** 防御・サステイン系（カウンター / ディスエンゲージ） */
const DEFENSIVE_EFFECT_IDS = new Set([
  'shield',
  'heal',
  'lifesteal',
  'invulnerable',
  'cc_immunity',
  'damage_reduction',
  'projectile_block',
])

/** 敵の突進・行動を妨害する効果 */
const ANTI_ENGAGE_EFFECT_IDS = new Set([
  'knockback',
  'ground',
  'snare',
  'polymorph',
  'fear',
  'charm',
  'taunt',
  'sleep',
])

/** ポークの起点になり得る遠距離CC */
const POKE_CC_EFFECT_IDS = new Set(['slow', 'snare', 'stun'])

function getsEffect(skill: SkillItem, ids: Set<string>): EffectDetail | undefined {
  return skill.effects.find((effect) => ids.has(effect.id))
}

function hasHardCc(champion: ChampionProfile): boolean {
  return champion.skills.some((skill) =>
    skill.effects.some((effect) => effect.category === 'hard_cc'),
  )
}

function hasEngageTool(champion: ChampionProfile): boolean {
  return champion.skills.some((skill) =>
    MOBILITY_PATTERN.test(`${skill.name} ${skill.description}`),
  )
}

function isAllIn(champion: ChampionProfile): boolean {
  return hasHardCc(champion) && hasEngageTool(champion)
}

function isPoke(champion: ChampionProfile): boolean {
  const skillshots = champion.skills.filter(
    (skill) => skill.targetType === 'skillshot',
  )

  if (skillshots.length < 2) return false

  return skillshots.some(
    (skill) =>
      getsEffect(skill, POKE_CC_EFFECT_IDS) !== undefined ||
      DAMAGE_PATTERN.test(skill.description),
  )
}

function isCounter(champion: ChampionProfile): boolean {
  return champion.skills.some(
    (skill) =>
      getsEffect(skill, DEFENSIVE_EFFECT_IDS) !== undefined ||
      getsEffect(skill, ANTI_ENGAGE_EFFECT_IDS) !== undefined,
  )
}

/** チャンピオン単位の判定結果キャッシュ */
const compositionCache = new Map<string, CompositionType[]>()

/**
 * チャンピオンの全スキル属性から戦術タイプを動的に判定する。
 * 複数タイプに該当する場合は all_in → poke → counter の順で返す。
 */
export function classifyChampionComposition(
  champion: ChampionProfile,
): CompositionType[] {
  const cached = compositionCache.get(champion.championKey)
  if (cached) return cached

  const result: CompositionType[] = []
  if (isAllIn(champion)) result.push('all_in')
  if (isPoke(champion)) result.push('poke')
  if (isCounter(champion)) result.push('counter')

  compositionCache.set(champion.championKey, result)
  return result
}
