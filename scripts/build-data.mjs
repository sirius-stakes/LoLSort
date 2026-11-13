/**
 * チャンピオンデータ生成スクリプト
 * ------------------------------------------------------------
 * 1. Data Dragon (ja_JP) からチャンピオン名・スキル名・説明・画像を取得
 * 2. Meraki Analytics の構造化データから CC / バフ / デバフと効果時間を抽出
 * 3. src/data/champions.json を生成
 *
 * 実行: npm run data
 */
import fs from 'node:fs/promises'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const CACHE_DIR = path.join(ROOT, 'scripts', '.cache')
const OUT_FILE = path.join(ROOT, 'src', 'data', 'champions.json')

const DDRAGON = 'https://ddragon.leagueoflegends.com'
const MERAKI =
  'https://cdn.merakianalytics.com/riot/lol/resources/latest/en-US/champions.json'
const LOCALE = 'ja_JP'

const TAG_LABELS = {
  stun: 'スタン',
  sleep: '睡眠',
  snare: 'スネア',
  knockup: 'ノックアップ',
  suppression: 'サプレッション',
  charm: 'チャーム',
  taunt: 'タウント',
  fear: 'フィアー',
  polymorph: 'ポリモーフ',
  slow: 'スロー',
  silence: 'サイレンス',
  blind: 'ブラインド',
  ground: 'グラウンド',
  shield: 'シールド',
  haste: '移動速度増加',
  attackSpeed: '攻撃速度増加',
  heal: '回復',
  invulnerable: '無敵/アンストッパブル',
  armorShred: '防御力低下',
  grievous: '重傷',
  physical: '物理ダメージ',
  magic: '魔法ダメージ',
  true: '確定ダメージ',
}

/** 効果時間の優先度（CC → バフの順） */
const DURATION_PRIORITY = [
  'stun',
  'sleep',
  'snare',
  'knockup',
  'suppression',
  'charm',
  'taunt',
  'fear',
  'polymorph',
  'slow',
  'silence',
  'blind',
  'ground',
  'shield',
  'invulnerable',
  'haste',
  'attackSpeed',
  'heal',
  'armorShred',
  'grievous',
]

const HARD_CC = [
  'stun',
  'sleep',
  'snare',
  'knockup',
  'suppression',
  'charm',
  'taunt',
  'fear',
  'polymorph',
]
const BUFFS = ['shield', 'haste', 'attackSpeed', 'heal', 'invulnerable']

const SLOTS = ['Q', 'W', 'E', 'R']

const CLASS_LABELS = {
  Fighter: 'ファイター',
  Tank: 'タンク',
  Mage: 'メイジ',
  Assassin: 'アサシン',
  Marksman: 'マークスマン',
  Support: 'サポート',
}

const LANE_LABELS = {
  TOP: 'トップ',
  JUNGLE: 'ジャングル',
  MIDDLE: 'ミッド',
  BOTTOM: 'ボット',
  UTILITY: 'サポート',
  SUPPORT: 'サポート',
  MID: 'ミッド',
  BOT: 'ボット',
}

/**
 * 代表チャンピオンの手動補正。
 * 自動抽出で誤判定しやすいもの／特に見せたいスキルを固定する。
 */
const CURATED = {
  'Morgana:P': { tags: ['heal'] },
  'Morgana:Q': {
    tags: ['snare', 'magic'],
    duration: { min: 2, max: 3, label: 'スネア', source: 'curated' },
  },
  'Morgana:W': {
    tags: ['magic'],
    duration: { min: 5, max: 5, label: '持続', source: 'curated' },
  },
  'Morgana:E': {
    tags: ['shield', 'invulnerable'],
    duration: { min: 5, max: 5, label: 'シールド', source: 'curated' },
  },
  'Morgana:R': {
    tags: ['stun', 'slow', 'haste', 'magic'],
    duration: { min: 1.5, max: 2, label: 'スタン', source: 'curated' },
  },
  'Lux:P': { tags: ['magic'] },
  'Lux:Q': {
    tags: ['snare', 'magic'],
    duration: { min: 2, max: 2, label: 'スネア', source: 'curated' },
  },
  'Lux:W': {
    tags: ['shield'],
    duration: { min: 2.5, max: 2.5, label: 'シールド', source: 'curated' },
  },
  'Lux:E': {
    tags: ['slow', 'magic'],
    duration: { min: 5, max: 5, label: 'スロー', source: 'curated' },
  },
  'Lux:R': { tags: ['magic'] },
  'Ahri:P': { tags: ['heal'] },
  'Ahri:Q': { tags: ['magic', 'true'] },
  'Ahri:W': {
    tags: ['magic', 'haste'],
    duration: { min: 2, max: 2, label: '移動速度増加', source: 'curated' },
  },
  'Ahri:E': {
    tags: ['charm', 'slow', 'magic'],
    duration: { min: 1.2, max: 1.8, label: 'チャーム', source: 'curated' },
  },
  'Ahri:R': { tags: ['magic'] },
  'Nasus:P': { tags: ['heal'] },
  'Nasus:Q': { tags: ['physical'] },
  'Nasus:W': {
    tags: ['slow'],
    duration: { min: 5, max: 5, label: 'スロー', source: 'curated' },
  },
  'Nasus:E': {
    tags: ['magic', 'armorShred'],
    duration: { min: 5, max: 5, label: '防御力低下', source: 'curated' },
  },
  'Nasus:R': { tags: ['magic'] },
  'Lulu:P': { tags: ['magic'], removeTags: ['invulnerable'] },
  'Lulu:Q': {
    tags: ['slow', 'magic'],
    duration: { min: 2, max: 2, label: 'スロー', source: 'curated' },
  },
  'Lulu:W': {
    tags: ['polymorph', 'haste', 'attackSpeed'],
    duration: { min: 1.2, max: 2, label: 'ポリモーフ', source: 'curated' },
  },
  'Lulu:E': {
    tags: ['shield', 'magic'],
    duration: { min: 2.5, max: 2.5, label: 'シールド', source: 'curated' },
  },
  'Lulu:R': {
    tags: ['knockup', 'slow'],
    duration: { min: 1, max: 1, label: 'ノックアップ', source: 'curated' },
  },
  'Cassiopeia:W': {
    tags: ['ground', 'slow', 'magic'],
    duration: { min: 5, max: 5, label: 'スロー', source: 'curated' },
  },
  'Singed:W': {
    tags: ['ground', 'slow'],
    duration: { min: 3, max: 3, label: 'スロー', source: 'curated' },
  },
  'Quinn:Q': {
    tags: ['blind', 'physical'],
    duration: { min: 1.75, max: 1.75, label: 'ブラインド', source: 'curated' },
  },
  'Cassiopeia:R': {
    tags: ['stun', 'slow', 'magic'],
    duration: { min: 2, max: 2, label: 'スタン', source: 'curated' },
  },
  'Alistar:P': { removeTags: ['stun'] },
  'Sejuani:P': { removeTags: ['stun'] },
  'Kaisa:P': { removeTags: ['polymorph'] },
  'Shaco:W': { removeTags: ['invulnerable'] },
  'Shaco:R': { removeTags: ['invulnerable'] },
}

/* ------------------------------------------------------------------ */
/* fetch helpers                                                       */
/* ------------------------------------------------------------------ */

async function fetchJson(url, cacheName, { maxAgeMs = 1000 * 60 * 60 * 24 * 7 } = {}) {
  await fs.mkdir(CACHE_DIR, { recursive: true })
  const cachePath = path.join(CACHE_DIR, cacheName)

  try {
    const stat = await fs.stat(cachePath)
    if (Date.now() - stat.mtimeMs < maxAgeMs) {
      return JSON.parse(await fs.readFile(cachePath, 'utf8'))
    }
  } catch {
    /* cache miss */
  }

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { 'user-agent': 'rift-effects-data-builder/1.0' },
      })
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
      const json = await res.json()
      await fs.writeFile(cachePath, JSON.stringify(json))
      return json
    } catch (err) {
      if (attempt === 3) throw new Error(`Fetch failed: ${url} (${err.message})`)
      await new Promise((r) => setTimeout(r, 500 * attempt))
    }
  }
}

async function mapLimit(items, limit, fn) {
  const results = new Array(items.length)
  let cursor = 0
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++
      results[index] = await fn(items[index], index)
    }
  })
  await Promise.all(workers)
  return results
}

/* ------------------------------------------------------------------ */
/* text helpers                                                        */
/* ------------------------------------------------------------------ */

function cleanHtml(input = '') {
  return input
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\{\{[^}]+\}\}/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function asArray(value) {
  if (Array.isArray(value)) return value
  if (typeof value === 'string') return [value]
  return []
}

function stripAbilityNames(text, names = []) {
  let result = text
  for (const name of names) {
    if (!name) continue
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    result = result.replace(new RegExp(`\\b${escaped}\\b`, 'gi'), ' ')
  }
  return result
}

function joinAbilityText(ability, stripNames = []) {
  const parts = []
  for (const effect of ability?.effects ?? []) {
    if (effect?.description) parts.push(effect.description)
    for (const leveling of effect?.leveling ?? []) {
      if (leveling?.attribute) parts.push(leveling.attribute)
    }
  }
  // notes / blurb は「スキル名の引用」や「～された場合」など文脈外の語を含むため、
  // タグ判定には効果説明とレベル項目名だけを使う。
  // "Taste Their Fear" のようなスキル名自体に CC 名が含まれるケースも除外する。
  return stripAbilityNames(parts.join(' '), stripNames)
}

/** 英語テキストからタグを抽出 */
function detectTags(text, ability) {
  const tags = new Set()
  const t = text.toLowerCase()

  // 「～できない」「～無効」は付与効果ではないため CC 判定から除外する
  const ccText = t
    .replace(
      /cannot be (?:rooted|snared|slowed|stunned|knocked|disabled|immobilized|silenced|blinded|taunted|feared|charmed|suppressed|polymorphed)/g,
      ' ',
    )
    .replace(
      /\b(?:slow|stun|root|snare|silence|blind|taunt|fear|charm|suppression|knockup|polymorph|ground) immunity\b/g,
      ' ',
    )
    .replace(
      /immune to (?:slow|stun|root|snare|silence|blind|taunt|fear|charm|suppression|knockup|polymorph|ground)s?\b/g,
      ' ',
    )

  const hardPatterns = {
    stun: /\bstun(?:s|ned|ning)?\b/,
    sleep:
      /\b(?:fall|falls|falling) asleep\b|\bputs? (?:them|the target|enemies|all enemy champions|nearby enemies) to sleep\b|\bsleeps? (?:them|the target|enemies|champions?)\b|\bdrowsy\b/,
    snare: /\broots?\b|\brooted\b|\brooting\b|\bsnares?\b|\bsnared\b/,
    knockup:
      /\bknock(?:s|ed|ing)?\s+(?:(?:them|all|nearby)\s+)?up\b|\bknock(?:s|ed|ing)?\s+(?:all\s+)?(?:enemies|champions?)\s+up\b|\bairborne\b|\bknocked into the air\b|\blaunch(?:es|ed)?\b[^.]{0,30}\bair\b/,
    suppression: /\bsuppress(?:es|ed|ing|ion)?\b/,
    charm: /\bcharm(?:s|ed|ing)?\b/,
    taunt: /\btaunt(?:s|ed|ing)?\b/,
    fear: /\bfear(?:s|ed|ing)?\b/,
    polymorph:
      /\bpolymorphs?\b[^.]{0,40}\b(?:them|enemies|target|champions?)\b|\bpolymorphing (?:them|enemies|the target)\b|\b(?:become|becomes|are|is) polymorphed\b/,
  }

  const softPatterns = {
    slow: /\bslow(?:s|ed|ing)?\b/,
    silence:
      /\bsilences?\b[^.]{0,40}\b(?:them|enemies|target|champions?|units?)\b|\bsilencing (?:them|enemies|the target)\b|\b(?:enemies|targets?|champions?|units?) (?:are|is|be) silenced\b|\bapplies? silence\b/,
    blind:
      /\bblinds?\b[^.]{0,40}\b(?:them|enemies|target|champions?|units?)\b|\bblinding (?:them|enemies|the target)\b|\b(?:enemies|targets?|champions?|units?) (?:are|is|be) blinded\b|\bapplies? blind\b|\bnearsight(?:s|ed)?\b/,
    ground:
      /\bgrounds\b[^.]{0,30}\b(?:them|enemies|target|champions?|units?)\b|\b(?:become|becomes|becoming) grounded\b|\bgrounding (?:them|enemies|the target)\b|\bapplies? (?:a )?grounding\b/,
  }

  for (const [tag, re] of Object.entries({ ...hardPatterns, ...softPatterns })) {
    if (re.test(ccText)) tags.add(tag)
  }

  const healText = t
    .replace(/healing (?:reduction|received)/g, '')
    .replace(/reduce[sd]? healing/g, '')
  if (
    /\bheals?\b|\bhealing\b|\brestores? (?:health|hp)\b|\blife ?steal\b|\bhealth regeneration\b/.test(
      healText,
    )
  ) {
    tags.add('heal')
  }

  if (/\bshield(?:s|ed|ing)?\b|\bbarrier\b/.test(t)) {
    const shieldText = t
      .replace(/[^.]{0,60}\b(?:destroy|remove|break|steal|ignore)s?\b[^.]{0,60}\bshields?\b[^.]*\.?/g, '')
    if (/\bshield(?:s|ed|ing)?\b|\bbarrier\b/.test(shieldText)) tags.add('shield')
  }

  if (
    /\bbonus (?:movement|move) speed\b|\b(?:gain|gains|grant|grants|increase|increases|boost|boosts|empower|empowers)\b[^.]{0,50}\b(?:movement|move) speed\b|\b(?:movement|move) speed (?:is|are) increased\b|\bghosted\b|\bhaste\b/.test(
      t,
    )
  ) {
    tags.add('haste')
  }

  if (
    /\bbonus attack speed\b|\b(?:gain|gains|grant|grants|increase|increases|boost|boosts)\b[^.]{0,50}\battack speed\b/.test(
      t,
    )
  ) {
    tags.add('attackSpeed')
  }

  if (
    /invulnerab|\b(?:becomes?|becoming|remains?)\s+untargetable\b|\bunstoppable\b|\bimmune to (?:crowd control|disabling|cc)\b|\bcrowd control immunity\b|\bcc immunity\b|\bcannot be (?:targeted|disabled|slowed|rooted|stunned)\b/.test(
      t,
    )
  ) {
    tags.add('invulnerable')
  }

  if (
    /\barmor (?:reduction|shred)\b|\breduces? (?:the target'?s? )?armor\b|\bmagic resist(?:ance)? (?:reduction|shred)\b|\breduces? (?:the target'?s? )?magic resist(?:ance)?\b|\bshreds?\b[^.]{0,30}\bresist/.test(
      t,
    )
  ) {
    tags.add('armorShred')
  }

  if (/grievous wounds?|healing reduction|reduces? healing|reduced healing/.test(t)) {
    tags.add('grievous')
  }

  if (/\bmagic damage\b/.test(t) || ability?.damageType === 'MAGIC_DAMAGE') tags.add('magic')
  if (/\bphysical damage\b/.test(t) || ability?.damageType === 'PHYSICAL_DAMAGE')
    tags.add('physical')
  if (/\btrue damage\b/.test(t) || ability?.damageType === 'TRUE_DAMAGE') tags.add('true')

  return tags
}

/** 日本語テキストのみからタグを抽出（Meraki に無い場合のフォールバック） */
function detectJapaneseTags(text) {
  const tags = new Set()
  const map = {
    stun: /スタン/,
    sleep: /睡眠|眠/,
    snare: /スネア|拘束|移動不能/,
    knockup: /ノックアップ|打ち上げ/,
    suppression: /サプレッション|抑圧/,
    charm: /チャーム/,
    taunt: /タウント|挑発/,
    fear: /フィアー|恐怖/,
    polymorph: /ポリモーフ|変身/,
    slow: /スロウ|スロー|移動速度(?:低下|減少)/,
    silence: /サイレンス|沈黙/,
    blind: /ブラインド|目くらまし/,
    ground: /グラウンド|接地/,
    shield: /シールド|バリア/,
    haste: /移動速度(?:上昇|増加)|ヘイスト/,
    attackSpeed: /攻撃速度(?:上昇|増加)/,
    heal: /回復/,
    invulnerable: /無敵|アンストッパブル|ターゲット不可/,
    armorShred: /防御力(?:低下|減少)|魔法防御(?:低下|減少)/,
    grievous: /重傷/,
    physical: /物理ダメージ/,
    magic: /魔法ダメージ/,
    true: /確定ダメージ/,
  }
  for (const [tag, re] of Object.entries(map)) {
    if (re.test(text)) tags.add(tag)
  }
  return tags
}

/* ------------------------------------------------------------------ */
/* duration extraction                                                 */
/* ------------------------------------------------------------------ */

function durationTagFromAttribute(attribute = '') {
  const a = attribute.toLowerCase()
  if (/disable duration|cc duration|crowd control duration/.test(a)) return 'PRIMARY_CC'
  if (/effect duration|buff duration/.test(a)) return 'PRIMARY_BUFF'
  const table = [
    ['stun', /\bstun\b/],
    ['sleep', /\bsleep\b/],
    ['snare', /\broot|\bsnare|\bimmobiliz/],
    ['knockup', /\bknock|\bairborne/],
    ['suppression', /\bsuppress/],
    ['charm', /\bcharm/],
    ['taunt', /\btaunt/],
    ['fear', /\bfear|\bflee/],
    ['polymorph', /\bpoly ?morph/],
    ['slow', /\bslow/],
    ['silence', /\bsilence/],
    ['blind', /\bblind/],
    ['ground', /\bground/],
    ['shield', /\bshield|\bbarrier/],
    ['haste', /\bmovement speed|\bmove speed|\bhaste/],
    ['attackSpeed', /\battack speed/],
    ['heal', /\bheal|\brestore/],
    ['invulnerable', /\binvuln|\buntargetable|\bunstoppable/],
    ['armorShred', /\barmor reduction|\bmagic resist|\bresist/],
    ['grievous', /\bgrievous/],
  ]
  for (const [tag, re] of table) {
    if (re.test(a)) return tag
  }
  return /duration/.test(a) ? null : 'IGNORE'
}

function pickPrimaryTag(tags, kind) {
  const pool = kind === 'PRIMARY_CC' ? HARD_CC : BUFFS
  return DURATION_PRIORITY.find((tag) => tags.has(tag) && pool.includes(tag)) ?? null
}

function collectDurationCandidates(ability, tags, stripNames = []) {
  const candidates = []

  for (const effect of ability?.effects ?? []) {
    for (const leveling of effect?.leveling ?? []) {
      const attribute = leveling?.attribute ?? ''
      const tagRaw = durationTagFromAttribute(attribute)
      if (tagRaw === 'IGNORE') continue

      const seconds = []
      const isDurationAttribute = /duration/i.test(attribute)
      for (const modifier of leveling?.modifiers ?? []) {
        const values = modifier?.values ?? []
        const units = modifier?.units ?? []
        values.forEach((value, index) => {
          const unit = units[index] ?? units[0] ?? ''
          const unitIsSeconds = /sec/i.test(unit)
          // 「Disable Duration」など単位が空の秒数項目も存在する
          if (
            typeof value === 'number' &&
            (unitIsSeconds || (isDurationAttribute && !unit))
          ) {
            seconds.push(value)
          }
        })
      }
      if (!seconds.length) continue

      let tag = tagRaw
      if (tagRaw === 'PRIMARY_CC' || tagRaw === 'PRIMARY_BUFF') {
        tag = pickPrimaryTag(tags, tagRaw)
      }
      if (tag === null && !/duration/i.test(attribute)) continue

      candidates.push({
        tag,
        min: Math.min(...seconds),
        max: Math.max(...seconds),
        source: 'rank',
        attribute,
      })
    }
  }

  // 説明文の "for 2.5 seconds" / "for 1 : 3.5 seconds" / "for 1.25 / 1.5 / 1.75 seconds" など
  const durationRe =
    /(?:for|over|lasts?|lasting)\s+(?:the next\s+|up to\s+)?(\d+(?:\.\d+)?(?:\s*(?:\/|:|-|−|–|to)\s*\d+(?:\.\d+)?)*)\s*(?:\([^)]*\)\s*)?(?:seconds?|secs?)\b/gi

  for (const effect of ability?.effects ?? []) {
    const description = stripAbilityNames(effect?.description ?? '', stripNames)
    if (!description) continue
    const sentences = description.split(/(?<=[.!?])\s+/)
    for (const sentence of sentences) {
      if (/cooldown|recharge/i.test(sentence)) continue
      const sentenceTags = detectTags(sentence, ability)
      const tag = DURATION_PRIORITY.find((t) => sentenceTags.has(t)) ?? null
      if (!tag) continue

      durationRe.lastIndex = 0
      let match
      while ((match = durationRe.exec(sentence))) {
        const values = (match[1].match(/\d+(?:\.\d+)?/g) ?? []).map(Number)
        const seconds = values.filter((value) => Number.isFinite(value))
        if (!seconds.length) continue
        candidates.push({
          tag,
          min: Math.min(...seconds),
          max: Math.max(...seconds),
          source: 'text',
          attribute: 'description',
        })
      }
    }
  }

  return candidates
}

function chooseDuration(candidates, tags) {
  if (!candidates.length) return null

  const tagged = candidates.filter((c) => c.tag && tags.has(c.tag))
  const pool = tagged.length ? tagged : candidates.filter((c) => c.tag === null)
  if (!pool.length) return null

  pool.sort((a, b) => {
    const pa = a.tag ? DURATION_PRIORITY.indexOf(a.tag) : 999
    const pb = b.tag ? DURATION_PRIORITY.indexOf(b.tag) : 999
    if (pa !== pb) return pa - pb
    if (a.source !== b.source) return a.source === 'rank' ? -1 : 1
    return b.max - a.max
  })

  const best = pool[0]
  return {
    min: round(best.min),
    max: round(best.max),
    label: best.tag ? TAG_LABELS[best.tag] : '持続',
    source: best.source,
  }
}

function round(value) {
  return Math.round(value * 100) / 100
}

function extractCooldown(ability) {
  const values = []
  for (const modifier of ability?.cooldown?.modifiers ?? []) {
    for (const value of modifier?.values ?? []) {
      if (typeof value === 'number' && value > 0) values.push(value)
    }
  }
  if (!values.length) return null
  return { min: round(Math.min(...values)), max: round(Math.max(...values)) }
}

/* ------------------------------------------------------------------ */
/* build                                                               */
/* ------------------------------------------------------------------ */

function normalizeTags(tags) {
  const order = Object.keys(TAG_LABELS)
  return [...new Set(tags)].sort((a, b) => order.indexOf(a) - order.indexOf(b))
}

function buildSkill({ slot, name, description, icon, ability, fallbackText, stripNames = [] }) {
  const text = ability ? joinAbilityText(ability, stripNames) : fallbackText
  const tags = ability ? detectTags(text, ability) : detectJapaneseTags(fallbackText)
  const duration = ability
    ? chooseDuration(collectDurationCandidates(ability, tags, stripNames), tags)
    : null
  const cooldown = ability ? extractCooldown(ability) : null

  return {
    key: slot,
    name,
    description,
    icon,
    tags: normalizeTags(tags),
    duration,
    cooldown,
  }
}

async function main() {
  console.log('Fetching Data Dragon versions...')
  const versions = await fetchJson(
    `${DDRAGON}/api/versions.json`,
    'ddragon-versions.json',
    { maxAgeMs: 1000 * 60 * 60 * 6 },
  )
  const version = versions[0]

  console.log(`Data Dragon ${version} / ${LOCALE}`)
  const index = await fetchJson(
    `${DDRAGON}/cdn/${version}/data/${LOCALE}/champion.json`,
    `ddragon-${version}-${LOCALE}-champion.json`,
  )

  console.log('Fetching Meraki Analytics champion data...')
  const meraki = await fetchJson(MERAKI, 'meraki-champions.json', {
    maxAgeMs: 1000 * 60 * 60 * 24 * 3,
  })

  const merakiByKey = new Map(Object.entries(meraki).map(([key, value]) => [key.toLowerCase(), value]))
  const merakiById = new Map(Object.values(meraki).map((value) => [String(value.id), value]))

  const entries = Object.values(index.data)
  console.log(`Champions: ${entries.length} — fetching details...`)

  const details = await mapLimit(entries, 10, async (entry) => {
    const detail = await fetchJson(
      `${DDRAGON}/cdn/${version}/data/${LOCALE}/champion/${entry.id}.json`,
      `ddragon-${version}-${LOCALE}-${entry.id}.json`,
    )
    return detail.data[entry.id]
  })

  const champions = details.map((detail) => {
    const merakiChamp =
      merakiById.get(String(detail.key)) ??
      merakiByKey.get(detail.id.toLowerCase()) ??
      null

    const championKey = detail.id
    const skills = []

    const stripNames = []
    for (const slot of ['P', 'Q', 'W', 'E', 'R']) {
      for (const form of merakiChamp?.abilities?.[slot] ?? []) {
        if (form?.name) stripNames.push(form.name)
      }
    }

    // Passive
    const passiveAbility = merakiChamp?.abilities?.P?.[0] ?? null
    const passiveCurated = CURATED[`${championKey}:P`]
    const passive = buildSkill({
      slot: 'P',
      name: cleanHtml(detail.passive?.name ?? 'Passive'),
      description: cleanHtml(detail.passive?.description ?? ''),
      icon: `img/passive/${detail.passive?.image?.full ?? ''}`,
      ability: passiveAbility,
      fallbackText: cleanHtml(detail.passive?.description ?? ''),
      stripNames,
    })
    applyCurated(passive, passiveCurated)
    skills.push(passive)

    SLOTS.forEach((slot, index) => {
      const ddSpell = detail.spells?.[index]
      if (!ddSpell) return
      const ability = merakiChamp?.abilities?.[slot]?.[0] ?? null
      const skill = buildSkill({
        slot,
        name: cleanHtml(ddSpell.name ?? slot),
        description: cleanHtml(ddSpell.description ?? ''),
        icon: `img/spell/${ddSpell.image?.full ?? ''}`,
        ability,
        fallbackText: cleanHtml(ddSpell.description ?? ''),
        stripNames,
      })
      applyCurated(skill, CURATED[`${championKey}:${slot}`])
      skills.push(skill)
    })

    return {
      id: detail.id,
      key: detail.key,
      name: detail.name,
      title: detail.title,
      icon: `img/champion/${detail.image?.full ?? ''}`,
      classes: (detail.tags ?? []).map((tag) => CLASS_LABELS[tag] ?? tag),
      lanes: (merakiChamp?.positions ?? []).map((lane) => LANE_LABELS[lane] ?? lane),
      skills,
    }
  })

  champions.sort((a, b) => a.name.localeCompare(b.name, 'ja'))

  const skillCount = champions.reduce((sum, c) => sum + c.skills.length, 0)

  const output = {
    meta: {
      version,
      locale: LOCALE,
      generatedAt: new Date().toISOString(),
      championCount: champions.length,
      skillCount,
      sources: [
        'Data Dragon (Riot Games) — champion / spell names, descriptions, images',
        'Meraki Analytics — structured crowd control & effect durations',
      ],
    },
    champions,
  }

  await fs.mkdir(path.dirname(OUT_FILE), { recursive: true })
  await fs.writeFile(OUT_FILE, JSON.stringify(output))
  console.log(`✓ ${OUT_FILE}`)
  console.log(`  ${champions.length} champions / ${skillCount} skills / patch ${version}`)
}

function applyCurated(skill, curated) {
  if (!curated) return
  if (curated.tags) {
    const removed = new Set(curated.removeTags ?? [])
    skill.tags = normalizeTags([...curated.tags.filter((t) => !removed.has(t))])
  } else if (curated.removeTags) {
    const removed = new Set(curated.removeTags)
    skill.tags = skill.tags.filter((tag) => !removed.has(tag))
  }
  if (curated.duration) skill.duration = curated.duration
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
