import type { SkillItem } from './skill'

/** 類似チャンピオン診断で使用するレーン区分 */
export type Lane = 'Top' | 'Jungle' | 'Mid' | 'ADC' | 'Support'

export interface ChampionProfile {
  championKey: string
  championName: string
  championIconUrl: string
  /** Data Dragon のクラス（Mage / Support など） */
  roles: string[]
  /** 実際にプレイされるレーン */
  lanes: Lane[]
  /** P / Q / W / E / R をキー順に保持 */
  skills: SkillItem[]
}
