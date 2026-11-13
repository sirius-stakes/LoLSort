import type {
  DamageType,
  EffectCategory,
  SkillKey,
  TargetType,
} from '../../types/skill'

export interface CategoryMeta {
  label: string
  shortLabel: string
  description: string
  /** カード上の小型バッジ */
  badge: string
  /** フィルターで選択中 */
  active: string
  dot: string
  heading: string
}

export const EFFECT_CATEGORY_META: Record<EffectCategory, CategoryMeta> = {
  hard_cc: {
    label: 'ハードCC',
    shortLabel: 'ハードCC',
    description: 'スタン・スネア・ノックアップ・サプレッションなど',
    badge: 'border-[#E0645A]/45 bg-[#E0645A]/10 text-[#FFB9AE]',
    active:
      'border-[#E0645A]/70 bg-[#E0645A]/15 text-[#FFB9AE] shadow-[0_0_12px_rgba(224,100,90,0.12)]',
    dot: 'bg-[#E0645A]',
    heading: 'text-[#FF9D90]',
  },
  soft_cc: {
    label: 'ソフトCC',
    shortLabel: 'ソフトCC',
    description: 'スロー・サイレンス・ブラインドなど',
    badge: 'border-[#6FB7D9]/40 bg-[#6FB7D9]/10 text-[#B5E4F7]',
    active:
      'border-[#6FB7D9]/70 bg-[#6FB7D9]/15 text-[#B5E4F7] shadow-[0_0_12px_rgba(111,183,217,0.12)]',
    dot: 'bg-[#6FB7D9]',
    heading: 'text-[#9AD4EC]',
  },
  buff: {
    label: 'バフ',
    shortLabel: 'バフ',
    description: 'シールド・ヘイスト・回復・無敵など',
    badge: 'border-[#3FB68B]/40 bg-[#3FB68B]/10 text-[#9BE8C8]',
    active:
      'border-[#3FB68B]/70 bg-[#3FB68B]/15 text-[#9BE8C8] shadow-[0_0_12px_rgba(63,182,139,0.12)]',
    dot: 'bg-[#3FB68B]',
    heading: 'text-[#7FDCBA]',
  },
  debuff: {
    label: 'デバフ',
    shortLabel: 'デバフ',
    description: 'AR/MR低下・AS低下・重傷など',
    badge: 'border-[#C89B3C]/45 bg-[#C89B3C]/10 text-[#EBD49B]',
    active:
      'border-[#C89B3C]/80 bg-[#C89B3C]/15 text-[#EBD49B] shadow-[0_0_12px_rgba(200,155,60,0.14)]',
    dot: 'bg-[#C89B3C]',
    heading: 'text-[#E4C784]',
  },
}

export const EFFECT_CATEGORY_ORDER: EffectCategory[] = [
  'hard_cc',
  'soft_cc',
  'buff',
  'debuff',
]

export const SKILL_KEYS: SkillKey[] = ['P', 'Q', 'W', 'E', 'R']

export const SKILL_KEY_STYLES: Record<SkillKey, string> = {
  P: 'border-[#C89B3C]/70 bg-[#C89B3C]/20 text-[#F0D89A]',
  Q: 'border-[#5AB0E0]/70 bg-[#5AB0E0]/15 text-[#A9DCF2]',
  W: 'border-[#3FB68B]/70 bg-[#3FB68B]/15 text-[#9BE8C8]',
  E: 'border-[#A78BFA]/70 bg-[#A78BFA]/15 text-[#D5C8FF]',
  R: 'border-[#E0645A]/70 bg-[#E0645A]/15 text-[#FFB9AE]',
}

interface TargetMeta {
  /** カード上の表示 */
  label: string
  /** フィルター上の表示 */
  filterLabel: string
  description: string
  badge: string
  active: string
}

export const TARGET_TYPE_META: Record<TargetType, TargetMeta> = {
  point_and_click: {
    label: '対象指定',
    filterLabel: '対象指定（必中）',
    description: '敵や味方を直接指定する',
    badge: 'border-[#E8B84B]/45 bg-[#E8B84B]/10 text-[#F5D793]',
    active: 'border-[#E8B84B]/70 bg-[#E8B84B]/15 text-[#F5D793]',
  },
  skillshot: {
    label: 'スキルショット',
    filterLabel: 'スキルショット',
    description: '方向を指定して放つ',
    badge: 'border-[#5AB0E0]/45 bg-[#5AB0E0]/10 text-[#A9DCF2]',
    active: 'border-[#5AB0E0]/70 bg-[#5AB0E0]/15 text-[#A9DCF2]',
  },
  aoe: {
    label: '範囲',
    filterLabel: '範囲',
    description: '地点や周囲に影響する',
    badge: 'border-[#A78BFA]/45 bg-[#A78BFA]/10 text-[#D5C8FF]',
    active: 'border-[#A78BFA]/70 bg-[#A78BFA]/15 text-[#D5C8FF]',
  },
  self: {
    label: '自身',
    filterLabel: '自身',
    description: '自身や味方に付与する',
    badge: 'border-[#3FB68B]/45 bg-[#3FB68B]/10 text-[#9BE8C8]',
    active: 'border-[#3FB68B]/70 bg-[#3FB68B]/15 text-[#9BE8C8]',
  },
}

export const TARGET_TYPE_ORDER: TargetType[] = [
  'point_and_click',
  'skillshot',
  'aoe',
  'self',
]

interface DamageMeta {
  /** カード上の小型バッジ */
  label: string
  /** フィルター上の表示 */
  filterLabel: string
  description: string
  badge: string
  active: string
  dot: string
  /** 説明文ハイライト用 */
  highlight: string
}

export const DAMAGE_TYPE_META: Record<DamageType, DamageMeta> = {
  physical: {
    label: '物理',
    filterLabel: '物理 (AD)',
    description: '物理ダメージ（AD）を与えるスキル',
    badge:
      'border-orange-700/50 bg-orange-950/60 text-orange-400',
    active:
      'border-orange-600/70 bg-orange-950/80 text-orange-300 shadow-[0_0_12px_rgba(234,88,12,0.14)]',
    dot: 'bg-orange-500',
    highlight: 'rounded-[3px] bg-orange-950/60 px-0.5 font-semibold text-orange-400',
  },
  magic: {
    label: '魔法',
    filterLabel: '魔法 (AP)',
    description: '魔法ダメージ（AP）を与えるスキル',
    badge: 'border-sky-700/50 bg-sky-950/60 text-sky-400',
    active:
      'border-sky-600/70 bg-sky-950/80 text-sky-300 shadow-[0_0_12px_rgba(14,165,233,0.14)]',
    dot: 'bg-sky-500',
    highlight: 'rounded-[3px] bg-sky-950/60 px-0.5 font-semibold text-sky-400',
  },
  true: {
    label: '確定',
    filterLabel: '確定 (True)',
    description: '確定ダメージ（True）を与えるスキル',
    badge:
      'border-slate-400/50 bg-slate-800/80 text-slate-100',
    active:
      'border-slate-300/70 bg-slate-700/80 text-white shadow-[0_0_12px_rgba(203,213,225,0.14)]',
    dot: 'bg-slate-200',
    highlight: 'rounded-[3px] bg-slate-700/80 px-0.5 font-semibold text-slate-100',
  },
}

export const DAMAGE_TYPE_ORDER: DamageType[] = ['physical', 'magic', 'true']

export const NO_DAMAGE_META = {
  label: 'ダメージなし',
  description: 'ダメージを持たないユーティリティ・純粋バフスキル',
  active:
    'border-[#785A28]/70 bg-[#785A28]/20 text-[#E4C784] shadow-[0_0_12px_rgba(200,155,60,0.12)]',
  dot: 'bg-[#785A28]',
} as const
