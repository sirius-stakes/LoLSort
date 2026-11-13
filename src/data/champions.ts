import rawData from './champions.json'
import type { ChampionProfile, Lane } from '../types/champion'
import type { SkillItem } from '../types/skill'

/**
 * `scripts/fetchChampionData.ts` が Data Dragon / Meraki Analytics から生成した
 * 全チャンピオンデータ。JSON のリテラル型は string に広がるため、
 * 型定義に合わせて一度だけキャストする。
 */
export interface ChampionDataMeta {
  version: string
  locale: string
  generatedAt: string
  championCount: number
  skillCount: number
  sources: string[]
}

interface ChampionDataFile {
  meta: ChampionDataMeta
  champions: ChampionProfile[]
}

const DATA = rawData as unknown as ChampionDataFile

/** 生成時のパッチバージョンや取得元などのメタ情報 */
export const DATA_META: ChampionDataMeta = DATA.meta

/** 全チャンピオンのプロフィール（P/Q/W/E/R をキー順に保持） */
export const CHAMPIONS: ChampionProfile[] = DATA.champions

/** 検索・類似度・CC計算機で横断利用する全スキル */
export const ALL_SKILLS: SkillItem[] = CHAMPIONS.flatMap(
  (champion) => champion.skills,
)

export const CHAMPION_BY_KEY: Map<string, ChampionProfile> = new Map(
  CHAMPIONS.map((champion) => [champion.championKey, champion]),
)

/**
 * 各タブを開いた直後から結果を確認できるよう、基準チャンピオンを固定する。
 * データに存在しない場合のみ先頭チャンピオンへフォールバックする。
 */
export const DEFAULT_CHAMPION_KEY = CHAMPION_BY_KEY.has('Morgana')
  ? 'Morgana'
  : CHAMPIONS[0]?.championKey ?? 'Morgana'

/** チャンピオンキーごとのレーン（生成データから導出） */
export const CHAMPION_LANES: Record<string, Lane[]> = Object.fromEntries(
  CHAMPIONS.map((champion) => [champion.championKey, champion.lanes]),
)

export const LANES: Lane[] = ['Top', 'Jungle', 'Mid', 'ADC', 'Support']

export const CHAMPION_COUNT = CHAMPIONS.length
export const SKILL_COUNT = ALL_SKILLS.length
