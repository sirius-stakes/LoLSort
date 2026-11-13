/**
 * フェーズ1で採用する拡張スキルデータ構造。
 * 類似チャンピオン推薦 / CCチェイン計算機 / 効果量ランキングでも
 * そのまま再利用できるように、効果を EffectDetail 単位で保持する。
 */

export type SkillKey = 'P' | 'Q' | 'W' | 'E' | 'R'

export type TargetType = 'point_and_click' | 'skillshot' | 'aoe' | 'self'

/** スキルが与えるダメージ属性 */
export type DamageType = 'physical' | 'magic' | 'true'

export type EffectCategory =
  | 'hard_cc' // スタン, スネア, サプレッション, ノックアップ, チャーム, タウント等
  | 'soft_cc' // スロー, サイレンス, ブラインド, グラウンド等
  | 'buff' // シールド, ヘイスト, 攻撃速度増加, 回復, 無敵等
  | 'debuff' // AR/MR低下, 重傷, AS低下等

export interface EffectDetail {
  /** 例: 'snare', 'slow', 'armor_shred' */
  id: string
  /** 表示名: 'スネア', 'スロー', '物理防御低下' */
  label: string
  category: EffectCategory
  /** 効果時間（秒）。計算機・ランキングで使用（例: 2.0） */
  duration?: number
  /** 割合や固定値（例: "30%", "1.5秒〜2.5秒"） */
  valueText?: string
}

export interface SkillItem {
  /** 一意なID (例: 'morgana-q') */
  id: string
  /** チャンピオン英名 (例: 'Morgana') */
  championKey: string
  /** 日本語名 (例: 'モルガナ') */
  championName: string
  /** レーン/ロール (例: ['Support', 'Mage']) */
  championRole: string[]
  key: SkillKey
  /** スキル名 */
  name: string
  /** スキル詳細テキスト */
  description: string
  /** スキルアイコン (Data Dragon等) */
  iconUrl: string
  /** チャンピオンアイコン */
  championIconUrl: string
  /** 対象指定 / 方向指定 / 範囲 / 自身 */
  targetType: TargetType
  /**
   * スキルが与えるダメージ属性。
   * 複数属性（例: 物理 + 確定）を持つ場合はすべて保持し、
   * ダメージを持たないユーティリティスキルは空配列になる。
   */
  damageTypes: DamageType[]
  /** サモナースペル「クレンズ」で解除可能か */
  cleansable: boolean
  /** シルバーサッシュ（QSS）で解除可能か */
  qssCleanse: boolean
  /** 含まれるバフ・デバフ一覧 */
  effects: EffectDetail[]
}

/* ------------------------------------------------------------------ */
/* フィルター用の派生型（フェーズ1 UI で使用）                         */
/* ------------------------------------------------------------------ */

export type SkillKeyFilter = 'ALL' | SkillKey
export type TargetTypeFilter = 'ALL' | TargetType
