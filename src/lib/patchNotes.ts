import snapshotJson from '../data/patchNotes.json'
import type { PatchNoteEntry, PatchNotesData } from '../types'

export const PATCH_NOTES_LIST_URL =
  'https://www.leagueoflegends.com/ja-jp/news/tags/patch-notes/'

const PATCH_NOTES_ORIGIN = 'https://www.leagueoflegends.com'
const PATCH_NOTES_API_URL = '/api/patch-notes'
const DDRAGON_VERSIONS_URL =
  'https://ddragon.leagueoflegends.com/api/versions.json'

const SNAPSHOT = snapshotJson as unknown as PatchNotesData

export interface PatchNotesResult {
  data: PatchNotesData
  warning: string | null
}

function extractVersion(title: string): string | null {
  const match = title.match(/(\d{1,2}\.\d{1,2})/)
  return match ? match[1] : null
}

function normalizeEntry(value: unknown): PatchNoteEntry | null {
  if (!value || typeof value !== 'object') return null

  const record = value as Record<string, unknown>
  if (typeof record.title !== 'string' || typeof record.url !== 'string') {
    return null
  }

  let url: string
  try {
    url = new URL(record.url, PATCH_NOTES_ORIGIN).toString()
  } catch {
    return null
  }

  // `entries` / `publishedAt`（このアプリの API）と
  // `articles` / `date`（汎用パッチノート API）の両方の形式を受け付ける。
  const publishedAt =
    typeof record.publishedAt === 'string'
      ? record.publishedAt
      : typeof record.date === 'string'
        ? record.date
        : null

  return {
    id: typeof record.id === 'string' ? record.id : url,
    title: record.title,
    version:
      typeof record.version === 'string'
        ? record.version
        : extractVersion(record.title),
    publishedAt,
    url,
    summary: typeof record.summary === 'string' ? record.summary : '',
    thumbnail: typeof record.thumbnail === 'string' ? record.thumbnail : null,
  }
}

function normalizeData(value: unknown): PatchNotesData | null {
  if (!value || typeof value !== 'object') return null

  const record = value as Record<string, unknown>
  const rawEntries = Array.isArray(record.entries)
    ? record.entries
    : Array.isArray(record.articles)
      ? record.articles
      : null
  if (!rawEntries) return null

  const entries = rawEntries
    .map(normalizeEntry)
    .filter((entry): entry is PatchNoteEntry => entry !== null)

  if (entries.length === 0) return null

  return {
    source: record.source === 'official' ? 'official' : 'cache',
    fetchedAt:
      typeof record.fetchedAt === 'string'
        ? record.fetchedAt
        : new Date().toISOString(),
    gameVersion:
      typeof record.gameVersion === 'string' ? record.gameVersion : null,
    entries,
  }
}

async function fetchJson(url: string, timeoutMs: number): Promise<unknown> {
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { accept: 'application/json' },
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return await response.json()
  } finally {
    window.clearTimeout(timer)
  }
}

async function fetchLatestGameVersion(): Promise<string | null> {
  try {
    const value = await fetchJson(DDRAGON_VERSIONS_URL, 6000)
    return Array.isArray(value) && typeof value[0] === 'string'
      ? value[0]
      : null
  } catch {
    return null
  }
}

function buildDynamicEntry(gameVersion: string): PatchNoteEntry {
  const [major, minor] = gameVersion.split('.')
  const majorNumber = Number(major)
  const season =
    Number.isFinite(majorNumber) && majorNumber >= 15
      ? majorNumber + 10
      : majorNumber

  if (!Number.isFinite(season) || !minor) {
    return {
      id: `ddragon-${gameVersion}`,
      title: '最新パッチノート',
      version: null,
      publishedAt: null,
      url: PATCH_NOTES_LIST_URL,
      summary: `Data Dragon の最新ゲームバージョン ${gameVersion} に対応する公式パッチノートを確認できます。`,
      thumbnail: null,
    }
  }

  return {
    id: `ddragon-${gameVersion}`,
    title: `リーグ・オブ・レジェンド パッチノート ${season}.${minor}`,
    version: `${season}.${minor}`,
    publishedAt: null,
    url: `${PATCH_NOTES_ORIGIN}/ja-jp/news/game-updates/league-of-legends-patch-${season}-${minor}-notes`,
    summary: `Data Dragon の最新ゲームバージョン ${gameVersion} に対応する公式パッチノートです。`,
    thumbnail: null,
  }
}

async function buildFallback(): Promise<PatchNotesData> {
  const snapshot = normalizeData(SNAPSHOT)
  const gameVersion = await fetchLatestGameVersion()

  if (snapshot) {
    return {
      ...snapshot,
      source: 'cache',
      gameVersion: snapshot.gameVersion ?? gameVersion,
    }
  }

  if (gameVersion) {
    return {
      source: 'cache',
      fetchedAt: new Date().toISOString(),
      gameVersion,
      entries: [buildDynamicEntry(gameVersion)],
    }
  }

  throw new Error('保存済みのパッチノート情報がありません。')
}

let memo: PatchNotesResult | null = null
let inflight: Promise<PatchNotesResult> | null = null

/**
 * 公式サイトのパッチノートを取得する。
 * 1. `/api/patch-notes`（Vite の開発 / プレビューサーバー）
 * 2. 保存済みスナップショット + Data Dragon（静的ホスティング時）
 * の順でフォールバックする。
 */
export function loadPatchNotes(options?: {
  force?: boolean
}): Promise<PatchNotesResult> {
  if (!options?.force && memo) return Promise.resolve(memo)
  if (inflight) return inflight

  inflight = (async () => {
    try {
      const raw = await fetchJson(PATCH_NOTES_API_URL, 7000)
      const data = normalizeData(raw)
      if (!data) throw new Error('API のレスポンスが不正です。')

      const result: PatchNotesResult = {
        data,
        warning:
          data.source === 'cache'
            ? '公式サイトの最新情報を取得できなかったため、フォールバック情報を表示しています。'
            : null,
      }
      memo = result
      return result
    } catch {
      const data = await buildFallback()
      const result: PatchNotesResult = {
        data,
        warning:
          '最新情報を取得できなかったため、保存済みのデータを表示しています。',
      }
      memo = result
      return result
    }
  })().finally(() => {
    inflight = null
  })

  return inflight
}

export function formatPatchDate(value: string | null): string {
  if (!value) return '公開日不明'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '公開日不明'

  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Tokyo',
  }).format(date)
}

export function formatFetchedAt(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('ja-JP', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

export function isRecentPatch(value: string | null, days = 14): boolean {
  if (!value) return false

  const time = new Date(value).getTime()
  if (!Number.isFinite(time)) return false

  const now = Date.now()
  return time <= now && now - time <= days * 24 * 60 * 60 * 1000
}
