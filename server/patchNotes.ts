import type { PatchNoteEntry, PatchNotesData } from '../src/types.ts'

const PATCH_NOTES_TAG_URL =
  'https://www.leagueoflegends.com/ja-jp/news/tags/patch-notes/'
const PATCH_NOTES_ORIGIN = 'https://www.leagueoflegends.com'
const DDRAGON_VERSIONS_URL = 'https://ddragon.leagueoflegends.com/api/versions.json'
const MAX_ENTRIES = 5
const CACHE_TTL_MS = 30 * 60 * 1000

type JsonRecord = Record<string, unknown>

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null
}

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null
}

function cleanText(value: unknown): string {
  if (typeof value !== 'string') return ''

  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

function truncate(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value
  return `${value.slice(0, maxLength - 1).trimEnd()}…`
}

function extractVersion(title: string): string | null {
  const match = title.match(/(\d{1,2}\.\d{1,2})/)
  return match ? match[1] : null
}

/** __NEXT_DATA__ の中からニュース一覧の blade を探す */
function findNewsBlade(value: unknown): JsonRecord | null {
  if (Array.isArray(value)) {
    for (const child of value) {
      const found = findNewsBlade(child)
      if (found) return found
    }
    return null
  }

  if (!isRecord(value)) return null
  if (value.fragmentId === 'news' && Array.isArray(value.items)) return value

  for (const child of Object.values(value)) {
    const found = findNewsBlade(child)
    if (found) return found
  }

  return null
}

function toEntry(value: unknown): PatchNoteEntry | null {
  if (!isRecord(value)) return null

  const action = isRecord(value.action) ? value.action : null
  const payload = action && isRecord(action.payload) ? action.payload : null
  const rawUrl = readString(payload?.url)
  const title = cleanText(value.title)

  if (!rawUrl || !title) return null

  let url: string
  try {
    url = new URL(rawUrl, PATCH_NOTES_ORIGIN).toString()
  } catch {
    return null
  }

  const analytics = isRecord(value.analytics) ? value.analytics : null
  const description = isRecord(value.description)
    ? value.description.body
    : value.description
  const media = isRecord(value.media) ? value.media : null
  const imageMedia = isRecord(value.imageMedia) ? value.imageMedia : null
  const tags = Array.isArray(value.tags) ? value.tags : []

  const isPatchNote =
    tags.length === 0 ||
    tags.some((tag) => isRecord(tag) && tag.machineName === 'patch_notes')

  if (!isPatchNote) return null

  return {
    id: readString(analytics?.contentId) ?? url,
    title,
    version: extractVersion(title),
    publishedAt:
      readString(value.publishedAt) ?? readString(analytics?.publishDate),
    url,
    summary: truncate(cleanText(description), 190),
    thumbnail: readString(media?.url) ?? readString(imageMedia?.url),
  }
}

/** 公式パッチノート一覧ページの HTML から最新記事を抽出する */
export function parsePatchNotesPage(html: string): PatchNoteEntry[] {
  const match = html.match(
    /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/,
  )
  if (!match) return []

  let data: unknown
  try {
    data = JSON.parse(match[1])
  } catch {
    return []
  }

  const blade = findNewsBlade(data)
  if (!blade || !Array.isArray(blade.items)) return []

  const entries: PatchNoteEntry[] = []
  const seen = new Set<string>()

  for (const item of blade.items) {
    const entry = toEntry(item)
    if (!entry || seen.has(entry.url)) continue

    seen.add(entry.url)
    entries.push(entry)
    if (entries.length >= MAX_ENTRIES) break
  }

  return entries
}

async function fetchLatestGameVersion(): Promise<string | null> {
  try {
    const response = await fetch(DDRAGON_VERSIONS_URL, {
      signal: AbortSignal.timeout(8000),
    })
    if (!response.ok) return null

    const versions: unknown = await response.json()
    return Array.isArray(versions) && typeof versions[0] === 'string'
      ? versions[0]
      : null
  } catch {
    return null
  }
}

/** Data Dragon のバージョン（16.22.1）から公式パッチノートの URL を組み立てる */
function buildDynamicPatchEntry(gameVersion: string): PatchNoteEntry | null {
  const [major, minor] = gameVersion.split('.')
  const majorNumber = Number(major)
  const season = majorNumber >= 15 ? majorNumber + 10 : majorNumber

  if (!Number.isFinite(season) || !minor) return null

  const patchVersion = `${season}.${minor}`

  return {
    id: `ddragon-${gameVersion}`,
    title: `リーグ・オブ・レジェンド パッチノート ${patchVersion}`,
    version: patchVersion,
    publishedAt: null,
    url: `${PATCH_NOTES_ORIGIN}/ja-jp/news/game-updates/league-of-legends-patch-${season}-${minor}-notes`,
    summary: `Data Dragon の最新ゲームバージョン ${gameVersion} に対応する公式パッチノートです。スクレイピングが制限されている場合は、公式サイトで最新情報をご確認ください。`,
    thumbnail: null,
  }
}

/**
 * スクレイピングが失敗してもクライアントへ返せるフォールバック。
 * Data Dragon のバージョンから動的 URL を組み立て、公式一覧ページも併記する。
 */
function buildFallbackData(gameVersion: string | null): PatchNotesData {
  const entries: PatchNoteEntry[] = []
  const dynamicEntry = gameVersion ? buildDynamicPatchEntry(gameVersion) : null

  if (dynamicEntry) entries.push(dynamicEntry)

  entries.push({
    id: 'official-patch-notes-list',
    title: '公式パッチノート一覧',
    version: null,
    publishedAt: null,
    url: PATCH_NOTES_TAG_URL,
    summary:
      'リーグ・オブ・レジェンド公式サイトのパッチノート一覧です。最新の変更内容はこちらから確認できます。',
    thumbnail: null,
  })

  return {
    source: 'cache',
    fetchedAt: new Date().toISOString(),
    gameVersion,
    entries,
  }
}

export async function fetchPatchNotes(): Promise<PatchNotesData> {
  const [html, gameVersion] = await Promise.all([
    fetch(PATCH_NOTES_TAG_URL, {
      headers: {
        accept: 'text/html,application/xhtml+xml',
        'accept-language': 'ja-JP,ja;q=0.9',
        'user-agent':
          'Mozilla/5.0 (compatible; RiftEffects/1.0; +https://github.com/)',
      },
      signal: AbortSignal.timeout(12000),
    })
      .then((response) => (response.ok ? response.text() : null))
      .catch(() => null),
    fetchLatestGameVersion(),
  ])

  if (html) {
    const entries = parsePatchNotesPage(html)
    if (entries.length > 0) {
      return {
        source: 'official',
        fetchedAt: new Date().toISOString(),
        gameVersion,
        entries,
      }
    }
  }

  // ネットワーク制限・スクレイピングブロック時も 200 でフォールバックを返す
  return buildFallbackData(gameVersion)
}

let cached: { data: PatchNotesData; expiresAt: number } | null = null
let inflight: Promise<PatchNotesData> | null = null

/** 30分キャッシュ付きで最新パッチノートを取得する */
export function getPatchNotes(): Promise<PatchNotesData> {
  if (cached && Date.now() < cached.expiresAt) {
    return Promise.resolve(cached.data)
  }

  if (inflight) return inflight

  inflight = fetchPatchNotes()
    .then((data) => {
      cached = { data, expiresAt: Date.now() + CACHE_TTL_MS }
      return data
    })
    .finally(() => {
      inflight = null
    })

  return inflight
}
