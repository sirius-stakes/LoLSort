export type SkillKey = 'P' | 'Q' | 'W' | 'E' | 'R'

export type DurationSource = 'rank' | 'text' | 'curated'

export interface EffectDuration {
  min: number
  max: number
  label: string
  source: DurationSource
}

export interface Cooldown {
  min: number
  max: number
}

export interface Skill {
  key: SkillKey
  name: string
  description: string
  icon: string
  tags: string[]
  duration: EffectDuration | null
  cooldown: Cooldown | null
}

export interface Champion {
  id: string
  key: string
  name: string
  title: string
  icon: string
  classes: string[]
  lanes: string[]
  skills: Skill[]
}

export interface DataMeta {
  version: string
  locale: string
  generatedAt: string
  championCount: number
  skillCount: number
  sources: string[]
}

export interface ChampionData {
  meta: DataMeta
  champions: Champion[]
}

export interface SkillEntry {
  champion: Champion
  skill: Skill
}

export type TagMode = 'AND' | 'OR'
export type SkillKeyFilter = 'ALL' | SkillKey
export type SortKey =
  | 'champion'
  | 'durationDesc'
  | 'durationAsc'
  | 'skillKey'
  | 'tagCount'

export interface PatchNoteEntry {
  id: string
  title: string
  version: string | null
  publishedAt: string | null
  url: string
  summary: string
  thumbnail: string | null
}

export interface PatchNotesData {
  source: 'official' | 'cache'
  fetchedAt: string
  gameVersion: string | null
  entries: PatchNoteEntry[]
}
