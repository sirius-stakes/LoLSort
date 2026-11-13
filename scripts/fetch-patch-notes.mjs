/**
 * 最新パッチノートのスナップショット生成スクリプト
 * ------------------------------------------------------------
 * 公式サイト（ja-jp）のパッチノート一覧を取得し、
 * 最新5件を src/data/patchNotes.json に保存する。
 *
 * API が利用できない静的ホスティング環境では、このファイルが
 * クライアント側のフォールバックデータとして使われる。
 *
 * 実行: npm run patches
 */
import fs from 'node:fs/promises'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const OUT_FILE = path.join(ROOT, 'src', 'data', 'patchNotes.json')

const PATCH_NOTES_TAG_URL =
  'https://www.leagueoflegends.com/ja-jp/news/tags/patch-notes/'
const PATCH_NOTES_ORIGIN = 'https://www.leagueoflegends.com'
const DDRAGON_VERSIONS_URL = 'https://ddragon.leagueoflegends.com/api/versions.json'
const MAX_ENTRIES = 5

function isRecord(value) {
  return typeof value === 'object' && value !== null
}

function readString(value) {
  return typeof value === 'string' && value.length > 0 ? value : null
}

function cleanText(value) {
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

function truncate(value, maxLength) {
  if (value.length <= maxLength) return value
  return `${value.slice(0, maxLength - 1).trimEnd()}…`
}

function extractVersion(title) {
  const match = title.match(/(\d{1,2}\.\d{1,2})/)
  return match ? match[1] : null
}

function findNewsBlade(value) {
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

function toEntry(value) {
  if (!isRecord(value)) return null

  const action = isRecord(value.action) ? value.action : null
  const payload = action && isRecord(action.payload) ? action.payload : null
  const rawUrl = readString(payload?.url)
  const title = cleanText(value.title)

  if (!rawUrl || !title) return null

  let url
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

function parsePatchNotesPage(html) {
  const match = html.match(
    /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/,
  )
  if (!match) return []

  let data
  try {
    data = JSON.parse(match[1])
  } catch {
    return []
  }

  const blade = findNewsBlade(data)
  if (!blade || !Array.isArray(blade.items)) return []

  const entries = []
  const seen = new Set()

  for (const item of blade.items) {
    const entry = toEntry(item)
    if (!entry || seen.has(entry.url)) continue

    seen.add(entry.url)
    entries.push(entry)
    if (entries.length >= MAX_ENTRIES) break
  }

  return entries
}

async function fetchLatestGameVersion() {
  try {
    const response = await fetch(DDRAGON_VERSIONS_URL, {
      signal: AbortSignal.timeout(8000),
    })
    if (!response.ok) return null

    const versions = await response.json()
    return Array.isArray(versions) && typeof versions[0] === 'string'
      ? versions[0]
      : null
  } catch {
    return null
  }
}

async function main() {
  console.log('公式パッチノート一覧を取得しています…')

  const [response, gameVersion] = await Promise.all([
    fetch(PATCH_NOTES_TAG_URL, {
      headers: {
        accept: 'text/html,application/xhtml+xml',
        'accept-language': 'ja-JP,ja;q=0.9',
        'user-agent':
          'Mozilla/5.0 (compatible; RiftEffects/1.0; +https://github.com/)',
      },
      signal: AbortSignal.timeout(15000),
    }),
    fetchLatestGameVersion(),
  ])

  if (!response.ok) {
    throw new Error(`公式パッチノートの取得に失敗しました (HTTP ${response.status})`)
  }

  const entries = parsePatchNotesPage(await response.text())
  if (entries.length === 0) {
    throw new Error('公式パッチノートの解析に失敗しました')
  }

  const data = {
    source: 'cache',
    fetchedAt: new Date().toISOString(),
    gameVersion,
    entries,
  }

  await fs.mkdir(path.dirname(OUT_FILE), { recursive: true })
  await fs.writeFile(OUT_FILE, `${JSON.stringify(data, null, 2)}\n`, 'utf8')

  console.log(`保存しました: ${path.relative(ROOT, OUT_FILE)}`)
  for (const entry of entries) {
    console.log(`- ${entry.title} (${entry.publishedAt ?? '日付不明'})`)
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
