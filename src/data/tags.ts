export type TagCategory = 'hard' | 'soft' | 'buff' | 'debuff' | 'damage'

export type TagId =
  | 'stun'
  | 'sleep'
  | 'snare'
  | 'knockup'
  | 'suppression'
  | 'charm'
  | 'taunt'
  | 'fear'
  | 'polymorph'
  | 'slow'
  | 'silence'
  | 'blind'
  | 'ground'
  | 'shield'
  | 'haste'
  | 'attackSpeed'
  | 'heal'
  | 'invulnerable'
  | 'armorShred'
  | 'grievous'
  | 'physical'
  | 'magic'
  | 'true'

export interface TagDefinition {
  id: TagId
  label: string
  category: TagCategory
  /** 説明文ハイライト用の同義語 */
  synonyms: string[]
}

export const TAGS: Record<TagId, TagDefinition> = {
  stun: { id: 'stun', label: 'スタン', category: 'hard', synonyms: ['スタン', '気絶'] },
  sleep: { id: 'sleep', label: '睡眠', category: 'hard', synonyms: ['睡眠', '眠り', '眠'] },
  snare: {
    id: 'snare',
    label: 'スネア',
    category: 'hard',
    synonyms: ['スネア', '拘束', '移動不能', 'ルート'],
  },
  knockup: {
    id: 'knockup',
    label: 'ノックアップ',
    category: 'hard',
    synonyms: ['ノックアップ', '打ち上げ', '空中'],
  },
  suppression: {
    id: 'suppression',
    label: 'サプレッション',
    category: 'hard',
    synonyms: ['サプレッション', '抑圧'],
  },
  charm: { id: 'charm', label: 'チャーム', category: 'hard', synonyms: ['チャーム'] },
  taunt: { id: 'taunt', label: 'タウント', category: 'hard', synonyms: ['タウント', '挑発'] },
  fear: { id: 'fear', label: 'フィアー', category: 'hard', synonyms: ['フィアー', '恐怖'] },
  polymorph: {
    id: 'polymorph',
    label: 'ポリモーフ',
    category: 'hard',
    synonyms: ['ポリモーフ', '変身'],
  },
  slow: {
    id: 'slow',
    label: 'スロー',
    category: 'soft',
    synonyms: ['スロウ', 'スロー', '移動速度低下', '移動速度減少'],
  },
  silence: {
    id: 'silence',
    label: 'サイレンス',
    category: 'soft',
    synonyms: ['サイレンス', '沈黙'],
  },
  blind: {
    id: 'blind',
    label: 'ブラインド',
    category: 'soft',
    synonyms: ['ブラインド', '目くらまし', '盲目'],
  },
  ground: {
    id: 'ground',
    label: 'グラウンド',
    category: 'soft',
    synonyms: ['グラウンド', '接地', '釘付け'],
  },
  shield: {
    id: 'shield',
    label: 'シールド',
    category: 'buff',
    synonyms: ['シールド', 'バリア', '障壁'],
  },
  haste: {
    id: 'haste',
    label: '移動速度増加',
    category: 'buff',
    synonyms: ['移動速度増加', '移動速度上昇', '移動速度が増加', '移動速度が上昇', 'ヘイスト'],
  },
  attackSpeed: {
    id: 'attackSpeed',
    label: '攻撃速度増加',
    category: 'buff',
    synonyms: ['攻撃速度増加', '攻撃速度上昇', '攻撃速度が増加', '攻撃速度が上昇'],
  },
  heal: {
    id: 'heal',
    label: '回復',
    category: 'buff',
    synonyms: ['回復', 'ライフスティール', '体力回復'],
  },
  invulnerable: {
    id: 'invulnerable',
    label: '無敵/アンストッパブル',
    category: 'buff',
    synonyms: ['無敵', 'アンストッパブル', 'ターゲット不可', '行動妨害無効', 'CC無効'],
  },
  armorShred: {
    id: 'armorShred',
    label: '防御力低下',
    category: 'debuff',
    synonyms: ['防御力低下', '防御力減少', '物理防御低下', '魔法防御低下', '魔法防御減少'],
  },
  grievous: {
    id: 'grievous',
    label: '重傷',
    category: 'debuff',
    synonyms: ['重傷'],
  },
  physical: {
    id: 'physical',
    label: '物理ダメージ',
    category: 'damage',
    synonyms: ['物理ダメージ'],
  },
  magic: {
    id: 'magic',
    label: '魔法ダメージ',
    category: 'damage',
    synonyms: ['魔法ダメージ'],
  },
  true: {
    id: 'true',
    label: '確定ダメージ',
    category: 'damage',
    synonyms: ['確定ダメージ'],
  },
}

export interface TagGroup {
  id: TagCategory
  label: string
  caption: string
  tags: TagId[]
}

export const TAG_GROUPS: TagGroup[] = [
  {
    id: 'hard',
    label: '行動妨害（ハードCC）',
    caption: '敵の行動を完全に止める',
    tags: ['stun', 'snare', 'knockup', 'suppression', 'charm', 'taunt', 'fear', 'sleep', 'polymorph'],
  },
  {
    id: 'soft',
    label: '移動/行動阻害（ソフトCC）',
    caption: '移動やスキル使用を制限する',
    tags: ['slow', 'silence', 'blind', 'ground'],
  },
  {
    id: 'buff',
    label: '自身・味方バフ',
    caption: '味方を強化・保護する',
    tags: ['shield', 'haste', 'attackSpeed', 'heal', 'invulnerable'],
  },
  {
    id: 'debuff',
    label: '敵デバフ',
    caption: '敵の耐性や回復を弱める',
    tags: ['armorShred', 'grievous'],
  },
  {
    id: 'damage',
    label: 'ダメージ種別',
    caption: 'スキルが与えるダメージの種類',
    tags: ['physical', 'magic', 'true'],
  },
]

export interface CategoryStyle {
  /** サイドバーのタグ選択時 */
  active: string
  /** カード上の小型バッジ */
  badge: string
  dot: string
  /** グループ見出しのアクセント */
  heading: string
}

export const CATEGORY_STYLES: Record<TagCategory, CategoryStyle> = {
  hard: {
    active: 'border-[#E0645A]/70 bg-[#E0645A]/15 text-[#FFB9AE] shadow-[0_0_12px_rgba(224,100,90,0.12)]',
    badge: 'border-[#E0645A]/45 bg-[#E0645A]/10 text-[#FFB9AE]',
    dot: 'bg-[#E0645A]',
    heading: 'text-[#FF9D90]',
  },
  soft: {
    active: 'border-[#6FB7D9]/70 bg-[#6FB7D9]/15 text-[#B5E4F7] shadow-[0_0_12px_rgba(111,183,217,0.12)]',
    badge: 'border-[#6FB7D9]/40 bg-[#6FB7D9]/10 text-[#B5E4F7]',
    dot: 'bg-[#6FB7D9]',
    heading: 'text-[#9AD4EC]',
  },
  buff: {
    active: 'border-[#3FB68B]/70 bg-[#3FB68B]/15 text-[#9BE8C8] shadow-[0_0_12px_rgba(63,182,139,0.12)]',
    badge: 'border-[#3FB68B]/40 bg-[#3FB68B]/10 text-[#9BE8C8]',
    dot: 'bg-[#3FB68B]',
    heading: 'text-[#7FDCBA]',
  },
  debuff: {
    active: 'border-[#C89B3C]/80 bg-[#C89B3C]/15 text-[#EBD49B] shadow-[0_0_12px_rgba(200,155,60,0.14)]',
    badge: 'border-[#C89B3C]/45 bg-[#C89B3C]/10 text-[#EBD49B]',
    dot: 'bg-[#C89B3C]',
    heading: 'text-[#E4C784]',
  },
  damage: {
    active: 'border-[#A78BFA]/70 bg-[#A78BFA]/15 text-[#D5C8FF] shadow-[0_0_12px_rgba(167,139,250,0.12)]',
    badge: 'border-[#A78BFA]/40 bg-[#A78BFA]/10 text-[#D5C8FF]',
    dot: 'bg-[#A78BFA]',
    heading: 'text-[#C4B2FF]',
  },
}

export const SKILL_KEYS = ['P', 'Q', 'W', 'E', 'R'] as const

export const SKILL_KEY_STYLES: Record<(typeof SKILL_KEYS)[number], string> = {
  P: 'border-[#C89B3C]/70 bg-[#C89B3C]/20 text-[#F0D89A]',
  Q: 'border-[#5AB0E0]/70 bg-[#5AB0E0]/15 text-[#A9DCF2]',
  W: 'border-[#3FB68B]/70 bg-[#3FB68B]/15 text-[#9BE8C8]',
  E: 'border-[#A78BFA]/70 bg-[#A78BFA]/15 text-[#D5C8FF]',
  R: 'border-[#E0645A]/70 bg-[#E0645A]/15 text-[#FFB9AE]',
}

export const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: 'champion', label: 'チャンピオン名（昇順）' },
  { value: 'durationDesc', label: '効果時間（長い順）' },
  { value: 'durationAsc', label: '効果時間（短い順）' },
  { value: 'skillKey', label: 'スキルキー順（P→R）' },
  { value: 'tagCount', label: '効果タグ数（多い順）' },
]
