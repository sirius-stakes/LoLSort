/**
 * 全チャンピオンのスキルデータを Data Dragon (ja_JP) から一括取得し、
 * アプリの型定義 (src/types/skill.ts / src/types/champion.ts) に合わせて
 * src/data/champions.json を生成するスクリプト。
 *
 * 実行:
 *   npm run fetch:data
 *   node scripts/fetchChampionData.ts
 *
 * Node.js 23.6+ では TypeScript の型注釈をネイティブに除去して実行できます。
 * Node.js 22.6〜23.5 の場合は `node --experimental-strip-types ...` を使用してください。
 *
 * データソース:
 *   1. Riot Data Dragon (ja_JP) — チャンピオン / スキル名・説明・画像
 *   2. Meraki Analytics (CommunityDragon 由来のコミュニティデータ)
 *      — CC / 発動タイプ / レーン / 効果時間の補完
 *   3. 日本語説明文のキーワードパーサー — バフ・デバフ・対象指定形式・解除可否
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import type {
  DamageType,
  EffectCategory,
  EffectDetail,
  SkillItem,
  SkillKey,
  TargetType,
} from '../src/types/skill.ts'
import type { ChampionProfile, Lane } from '../src/types/champion.ts'

/* ------------------------------------------------------------------ */
/* 設定                                                                */
/* ------------------------------------------------------------------ */

const ROOT = path.resolve(import.meta.dirname, '..')
const CACHE_DIR = path.join(ROOT, 'scripts', '.cache')
const OUT_FILE = path.join(ROOT, 'src', 'data', 'champions.json')

const DDRAGON = 'https://ddragon.leagueoflegends.com'
const MERAKI =
  'https://cdn.merakianalytics.com/riot/lol/resources/latest/en-US/champions.json'
const LOCALE = 'ja_JP'
const USER_AGENT = 'rift-effects-data-builder/2.0'
const BATCH_SIZE = 8
const BATCH_DELAY_MS = 60
const WEEK_MS = 1000 * 60 * 60 * 24 * 7
const DAY_MS = 1000 * 60 * 60 * 24

const SLOTS: SkillKey[] = ['P', 'Q', 'W', 'E', 'R']
const ACTIVE_SLOTS: SkillKey[] = ['Q', 'W', 'E', 'R']
const LANES: Lane[] = ['Top', 'Jungle', 'Mid', 'ADC', 'Support']

const ROLE_LABELS: Record<string, string> = {
  Fighter: 'Fighter',
  Tank: 'Tank',
  Mage: 'Mage',
  Assassin: 'Assassin',
  Marksman: 'Marksman',
  Support: 'Support',
}

const LANE_LABELS: Record<string, Lane> = {
  TOP: 'Top',
  JUNGLE: 'Jungle',
  MIDDLE: 'Mid',
  MID: 'Mid',
  BOTTOM: 'ADC',
  BOT: 'ADC',
  ADC: 'ADC',
  UTILITY: 'Support',
  SUPPORT: 'Support',
}

/* ------------------------------------------------------------------ */
/* 効果定義                                                            */
/* ------------------------------------------------------------------ */

interface EffectDefinition {
  id: string
  label: string
  category: EffectCategory
  pattern: RegExp
}

/**
 * 日本語説明文から抽出する効果。
 * 上から順に判定し、複数該当する場合はすべて保持する。
 */
const JP_EFFECT_DEFS: EffectDefinition[] = [
  // ハードCC
  { id: 'stun', label: 'スタン', category: 'hard_cc', pattern: /スタン|気絶/ },
  { id: 'sleep', label: '睡眠', category: 'hard_cc', pattern: /睡眠|眠らせ|眠る|スリープ/ },
  { id: 'snare', label: 'スネア', category: 'hard_cc', pattern: /スネア|拘束|移動不能|バインド|ルート/ },
  { id: 'knockup', label: 'ノックアップ', category: 'hard_cc', pattern: /ノックアップ|打ち上げ|空中に(?:打ち上げ|跳ね上げ|吹き飛ば)/ },
  { id: 'knockback', label: 'ノックバック', category: 'hard_cc', pattern: /ノックバック|吹き飛ば/ },
  { id: 'suppression', label: 'サプレッション', category: 'hard_cc', pattern: /サプレッション|抑圧/ },
  { id: 'charm', label: 'チャーム', category: 'hard_cc', pattern: /チャーム|魅了/ },
  { id: 'taunt', label: 'タウント', category: 'hard_cc', pattern: /タウント|挑発/ },
  { id: 'fear', label: 'フィアー', category: 'hard_cc', pattern: /フィアー|恐怖/ },
  { id: 'polymorph', label: 'ポリモーフ', category: 'hard_cc', pattern: /ポリモーフ|変身/ },

  // ソフトCC
  { id: 'slow', label: 'スロー', category: 'soft_cc', pattern: /スロー|スロウ|移動速度(?:を|が)?[^。]{0,8}(?:低下|減少)|移動速度を奪|減速/ },
  { id: 'silence', label: 'サイレンス', category: 'soft_cc', pattern: /サイレンス|静寂|沈黙/ },
  { id: 'blind', label: 'ブラインド', category: 'soft_cc', pattern: /ブラインド|目くらまし|盲目|視界(?:悪化|不良)/ },
  { id: 'ground', label: 'グラウンド', category: 'soft_cc', pattern: /グラウンド|接地|釘付け/ },

  // バフ
  { id: 'shield', label: 'シールド', category: 'buff', pattern: /シールド|バリア|障壁/ },
  { id: 'haste', label: '移動速度増加', category: 'buff', pattern: /移動速度(?:が|を)?[^。]{0,8}(?:増加|上昇)|ヘイスト/ },
  { id: 'attack_speed', label: '攻撃速度増加', category: 'buff', pattern: /攻撃速度(?:が|を)?[^。]{0,8}(?:増加|上昇)/ },
  { id: 'heal', label: '回復', category: 'buff', pattern: /回復|体力を回復|ライフ回復/ },
  { id: 'lifesteal', label: 'ライフスティール', category: 'buff', pattern: /ライフスティール|体力吸収/ },
  { id: 'invulnerable', label: '無敵', category: 'buff', pattern: /無敵|アンストッパブル|ターゲット不可/ },
  { id: 'cc_immunity', label: '行動妨害無効', category: 'buff', pattern: /行動妨害(?:効果)?(?:を)?(?:すべて)?(?:無効|耐性|解除)|CC無効/ },
  { id: 'damage_reduction', label: 'ダメージ軽減', category: 'buff', pattern: /ダメージ軽減|被ダメージ(?:減少|軽減)/ },
  { id: 'max_health', label: '最大体力増加', category: 'buff', pattern: /(?:最大)?体力(?:と|が|を)?[^。]{0,8}(?:増加|上昇)/ },
  { id: 'resistance', label: '防御力増加', category: 'buff', pattern: /(?:物理|魔法)防御(?:が|を)?[^。]{0,8}(?:増加|上昇)|防御力(?:が|を)?[^。]{0,8}(?:増加|上昇)/ },
  { id: 'range', label: '射程増加', category: 'buff', pattern: /射程(?:距離)?(?:が|を)?[^。]{0,8}(?:増加|上昇)/ },
  { id: 'vision', label: '視界確保', category: 'buff', pattern: /視界(?:を)?(?:確保|獲得)|可視状態/ },
  { id: 'invisibility', label: 'インビジブル', category: 'buff', pattern: /インビジブル|ステルス|透明/ },
  { id: 'projectile_block', label: '発射物無効', category: 'buff', pattern: /発射物(?:無効|消滅)|投射物(?:無効|消滅)/ },
  { id: 'armor_pen', label: '物理防御貫通', category: 'buff', pattern: /物理防御貫通|防御貫通/ },
  { id: 'magic_pen', label: '魔法防御貫通', category: 'buff', pattern: /魔法防御貫通/ },

  // デバフ
  { id: 'armor_shred', label: '物理防御低下', category: 'debuff', pattern: /物理防御(?:が|を)?[^。]{0,8}(?:低下|減少)|防御力(?:が|を)?[^。]{0,8}(?:低下|減少)/ },
  { id: 'magic_shred', label: '魔法防御低下', category: 'debuff', pattern: /魔法防御(?:が|を)?[^。]{0,8}(?:低下|減少)/ },
  { id: 'attack_speed_shred', label: '攻撃速度低下', category: 'debuff', pattern: /攻撃速度(?:が|を)?[^。]{0,8}(?:低下|減少)/ },
  { id: 'grievous', label: '重傷', category: 'debuff', pattern: /重傷|回復阻害|回復効果(?:低下|減少)/ },
]

const EFFECT_DEF_BY_ID = new Map(JP_EFFECT_DEFS.map((def) => [def.id, def]))

const HARD_CC_IDS = new Set(
  JP_EFFECT_DEFS.filter((def) => def.category === 'hard_cc').map((def) => def.id),
)
const SOFT_CC_IDS = new Set(
  JP_EFFECT_DEFS.filter((def) => def.category === 'soft_cc').map((def) => def.id),
)

/** クレンズ（サモナースペル）で解除できないCC */
const CLEANSE_IMMUNE_IDS = new Set(['suppression', 'knockup', 'knockback'])
/** QSS でも解除できないCC */
const QSS_IMMUNE_IDS = new Set(['knockup', 'knockback'])

/**
 * 変位系ハードCC。説明文に固有の秒数がない場合は、他の効果（スロー等）の
 * 秒数を流用せず、単体の標準値へフォールバックする。
 */
const DISPLACEMENT_CC_IDS = new Set(['knockup', 'knockback'])
const DEFAULT_HARD_CC_DURATIONS: Record<string, number> = {
  knockback: 0.5,
}

/** 効果キーワードと秒数表記を紐づける最大距離（文字数） */
const NEARBY_DURATION_DISTANCE = 40
const NEARBY_JAPANESE_DURATION_DISTANCE = 24
const NEARBY_DISPLACEMENT_DISTANCE = 12
const NEARBY_ENGLISH_DISPLACEMENT_DISTANCE = 24
/** ノックバックとして現実的な上限。これを超える秒数はスロー等の誤流用とみなす。 */
const MAX_KNOCKBACK_DURATION = 2

const HARD_CC_PRIORITY = [
  'suppression',
  'stun',
  'snare',
  'knockup',
  'knockback',
  'charm',
  'taunt',
  'fear',
  'sleep',
  'polymorph',
]

const BUFF_PRIORITY = [
  'shield',
  'invulnerable',
  'cc_immunity',
  'damage_reduction',
  'haste',
  'attack_speed',
  'heal',
  'lifesteal',
  'max_health',
  'resistance',
  'range',
  'vision',
  'invisibility',
  'projectile_block',
  'armor_pen',
  'magic_pen',
]

const EFFECT_ORDER = new Map(
  JP_EFFECT_DEFS.map((def, index) => [def.id, index] as const),
)

/**
 * 自動判定の誤検出を補正する最小限の手動オーバーライド。
 * 説明文に「スタンさせる」等が条件として書かれているパッシブなど。
 */
const CURATED_REMOVE: Record<string, string[]> = {
  'Alistar:P': ['stun', 'knockback'],
  'Sejuani:P': ['stun'],
  'Shaco:W': ['invulnerable'],
  'Shaco:R': ['invulnerable'],
  'Kaisa:P': ['polymorph'],
  'Morgana:E': ['invulnerable'],
  'Morgana:R': ['knockup'],
  'Ashe:Q': ['lifesteal'],
  'Yasuo:R': ['resistance'],
  'Nasus:Q': ['range'],
  'MonkeyKing:Q': ['range'],
  'MonkeyKing:W': ['attack_speed'],
  'MonkeyKing:R': ['attack_speed'],
  'KogMaw:R': ['max_health', 'invisibility'],
  'Ahri:W': ['max_health'],
  'Urgot:P': ['max_health'],
  'Urgot:W': ['slow', 'haste'],
  'Urgot:R': ['max_health'],
  'Malphite:P': ['max_health'],
}

/**
 * 代表チャンピオンの効果時間を手動で補完。
 * 説明文に秒数が明記されていないスキルでも CC 計算機 / ランキングが機能する。
 */
const CURATED_DURATIONS: Record<string, Record<string, number>> = {
  'Morgana:Q': { snare: 3 },
  'Morgana:E': { shield: 5, cc_immunity: 5 },
  'Morgana:R': { slow: 3, stun: 1.5 },
  'Malzahar:Q': { silence: 2 },
  'Malzahar:R': { suppression: 2.5 },
  'Yasuo:P': { shield: 1 },
  'Yasuo:Q': { knockup: 1 },
  'Yasuo:R': { knockup: 1, armor_pen: 15 },
  'Nasus:W': { slow: 5, attack_speed_shred: 5 },
  'Nasus:E': { armor_shred: 5 },
  'Nasus:R': { resistance: 15, range: 15 },
  'Lulu:Q': { slow: 2 },
  'Lulu:W': { polymorph: 2, haste: 2, attack_speed: 2 },
  'Lulu:E': { shield: 2.5 },
  'Lulu:R': { knockup: 0.75, max_health: 7, slow: 7 },
  'Alistar:Q': { knockup: 1 },
  'Alistar:W': { knockback: 0.5 },
  'Alistar:E': { stun: 1.5 },
  'Alistar:R': { cc_immunity: 7, damage_reduction: 7 },
  'Ashe:P': { slow: 2 },
  'Ashe:Q': { attack_speed: 6 },
  'Ashe:W': { slow: 2 },
  'Ashe:E': { vision: 5 },
  'Ashe:R': { stun: 3.5, slow: 3 },
  'Malphite:Q': { slow: 3 },
  'Malphite:W': { resistance: 5 },
  'Malphite:E': { attack_speed_shred: 3 },
  'Malphite:R': { knockup: 1.5 },
  'MonkeyKing:P': { resistance: 6 },
  'MonkeyKing:Q': { armor_shred: 3 },
  'MonkeyKing:W': { invisibility: 1.5 },
  'MonkeyKing:E': { attack_speed: 5 },
  'MonkeyKing:R': { knockup: 1, haste: 4 },
  'KogMaw:Q': { armor_shred: 4, magic_shred: 4 },
  'KogMaw:E': { slow: 2 },
  'KogMaw:R': { vision: 3 },
  'Urgot:E': { stun: 1.5, shield: 4 },
  'Urgot:R': { suppression: 1.5, fear: 1.5, slow: 4, vision: 4 },
}

/* ------------------------------------------------------------------ */
/* fetch ヘルパー                                                       */
/* ------------------------------------------------------------------ */

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms))
}

async function fetchJson(
  url: string,
  cacheName: string,
  maxAgeMs = WEEK_MS,
): Promise<any> {
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
        headers: { 'user-agent': USER_AGENT },
      })
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
      const json = await res.json()
      await fs.writeFile(cachePath, JSON.stringify(json))
      return json
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      if (attempt === 3) throw new Error(`Fetch failed: ${url} (${message})`)
      await sleep(500 * attempt)
    }
  }

  throw new Error(`Fetch failed: ${url}`)
}

async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length)
  let cursor = 0

  const workers = Array.from(
    { length: Math.min(limit, items.length) },
    async () => {
      while (cursor < items.length) {
        const index = cursor++
        results[index] = await fn(items[index], index)
        await sleep(BATCH_DELAY_MS)
      }
    },
  )

  await Promise.all(workers)
  return results
}

/* ------------------------------------------------------------------ */
/* テキストヘルパー                                                     */
/* ------------------------------------------------------------------ */

function decodeEntities(input: string): string {
  return input
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
}

function cleanHtml(input = ''): string {
  return decodeEntities(input)
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\{\{[^}]+\}\}/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Data Dragon の {{ e1 }} などのプレースホルダーを effectBurn で解決する */
function resolveDdragonText(description = '', effectBurn?: unknown): string {
  let text = description
  const burn = Array.isArray(effectBurn) ? effectBurn : []

  text = text.replace(/\{\{\s*e(\d+)\s*\}\}/gi, (_match, index) => {
    const value = burn[Number(index)]
    return value === null || value === undefined ? ' ' : String(value)
  })

  // f1 / a1 などは Data Dragon の説明文で数値が別フィールドに分かれる。
  // 表示上は邪魔になるため除去する。
  text = text.replace(/\{\{\s*[a-z]\d+\s*\}\}/gi, ' ')

  return cleanHtml(text)
}

function asArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value
  if (typeof value === 'string') return [value]
  return []
}

/* ------------------------------------------------------------------ */
/* ダメージ属性の判定                                                   */
/* ------------------------------------------------------------------ */

/**
 * Data Dragon の tooltip / description からダメージ属性を抽出する。
 *
 * - 物理: <physicalDamage> タグ、または「物理ダメージ」
 * - 魔法: <magicDamage> タグ、または「魔法ダメージ」
 * - 確定: <trueDamage> タグ、または「確定ダメージ」
 *
 * 1つのスキルが複数属性を持つ場合はすべて返し、
 * どれにも該当しないユーティリティスキルは空配列を返す。
 */
export function detectDamageTypes(
  ...texts: Array<string | null | undefined>
): DamageType[] {
  const text = texts.filter(Boolean).join(' ')
  const types: DamageType[] = []

  if (/<\s*physicalDamage\b/i.test(text) || /物理ダメージ/.test(text)) {
    types.push('physical')
  }
  if (/<\s*magicDamage\b/i.test(text) || /魔法ダメージ/.test(text)) {
    types.push('magic')
  }
  if (/<\s*trueDamage\b/i.test(text) || /確定ダメージ/.test(text)) {
    types.push('true')
  }

  return types
}

function stripAbilityNames(text: string, names: string[]): string {
  let result = text
  for (const name of names) {
    if (!name) continue
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    result = result.replace(new RegExp(`\\b${escaped}\\b`, 'gi'), ' ')
  }
  return result
}

function joinAbilityText(ability: any, stripNames: string[] = []): string {
  const parts: string[] = []
  for (const effect of ability?.effects ?? []) {
    if (effect?.description) parts.push(String(effect.description))
    for (const leveling of effect?.leveling ?? []) {
      if (leveling?.attribute) parts.push(String(leveling.attribute))
    }
  }
  return stripAbilityNames(parts.join(' '), stripNames)
}

/** 「スタンされない」「スロー無効」などの耐性表現を CC 判定から除外する */
function stripImmunityPhrases(text: string): string {
  return text
    .replace(
      /(スタン|スネア|スロー|スロウ|サイレンス|沈黙|ブラインド|チャーム|タウント|フィアー|サプレッション|ノックアップ|ノックバック|ポリモーフ)(?:効果)?(?:を)?(?:受けない|受けず|無効化(?:する)?|無効|されない|しない|耐性)/g,
      ' ',
    )
    .replace(
      /(?:移動速度低下|行動妨害|CC)(?:を)?(?:受けない|受けず|無効化(?:する)?|無効|されない)/g,
      ' ',
    )
}

/** 自身の移動速度低下だけを指している文章かどうか */
function isSelfOnlySlow(text: string): boolean {
  const selfSlow =
    /自身[^。]{0,30}移動速度(?:が|を)?(?:低下|減少)|移動速度(?:が|を)?(?:低下|減少)[^。]{0,12}(?:が|ものの|代わり)/.test(
      text,
    )
  const enemySlow =
    /敵[^。]{0,30}移動速度(?:を|が)?(?:低下|減少)|移動速度(?:を|が)?(?:低下|減少)[^。]{0,20}敵/.test(
      text,
    )
  return selfSlow && !enemySlow
}

function isHealingReductionOnly(text: string): boolean {
  return /回復阻害|回復効果(?:低下|減少)|重傷/.test(text) && !/体力を回復|ライフ回復/.test(text)
}

/** 英語テキストが「自身の移動速度低下」だけを指しているか */
function isSelfOnlySlowEnglish(text: string): boolean {
  const selfSlow =
    /\b(?:his|her|their|its|the caster'?s)\s+(?:base\s+)?(?:movement|move) speed (?:is|are|gets?)\s+(?:reduced|slowed)\b|\b(?:reduces|slows) (?:his|her|their|its) own (?:movement|move) speed\b|\bself-slow\b/.test(
      text,
    )
  const enemySlow =
    /\b(?:slow|slows|slowed|slowing)\b[^.]{0,40}\b(?:enemies|targets?|champions?|them)\b|\b(?:enemies|targets?|champions?)\b[^.]{0,20}\b(?:are|is|be)\s+slowed\b/.test(
      text,
    )
  return selfSlow && !enemySlow
}

/* ------------------------------------------------------------------ */
/* 日本語説明文からの効果抽出                                           */
/* ------------------------------------------------------------------ */

function detectJapaneseEffects(text: string): Set<string> {
  const ids = new Set<string>()
  const ccText = stripImmunityPhrases(text)

  for (const def of JP_EFFECT_DEFS) {
    // 無効化系のバフは元テキストから判定する
    const source =
      def.id === 'cc_immunity' || def.id === 'invulnerable' ? text : ccText

    if (def.id === 'slow' && isSelfOnlySlow(source)) continue
    if (def.id === 'heal' && isHealingReductionOnly(source)) continue
    if (def.pattern.test(source)) ids.add(def.id)
  }

  return ids
}

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[。．.!?！？])\s*/)
    .map((sentence) => sentence.trim())
    .filter(Boolean)
}

interface DurationSpan {
  start: number
  end: number
  min: number
  max: number
}

function collectJapaneseDurationSpans(sentence: string): DurationSpan[] {
  const spans: DurationSpan[] = []
  const durationRe =
    /(\d+(?:\.\d+)?)(?:\s*(?:〜|～|~|-|－|–|ー|to)\s*(\d+(?:\.\d+)?))?\s*秒(?:間)?/g

  let match: RegExpExecArray | null
  while ((match = durationRe.exec(sentence))) {
    const values = [match[1], match[2]]
      .filter((value): value is string => Boolean(value))
      .map(Number)
      .filter((value) => Number.isFinite(value) && value > 0)

    if (values.length === 0) continue

    spans.push({
      start: match.index,
      end: match.index + match[0].length,
      min: Math.min(...values),
      max: Math.max(...values),
    })
  }

  return spans
}

function collectJapaneseDurations(
  text: string,
  effectIds: Set<string>,
): Map<string, number> {
  const result = new Map<string, number>()
  const sentences = splitSentences(text)

  for (const sentence of sentences) {
    const durationSpans = collectJapaneseDurationSpans(sentence)
    if (durationSpans.length === 0) continue

    // 文中に登場する効果キーワードの位置をすべて収集する。
    const keywordMatches: Array<{
      id: string
      start: number
      end: number
    }> = []

    for (const id of effectIds) {
      const def = EFFECT_DEF_BY_ID.get(id)
      if (!def) continue
      if (id === 'slow' && isSelfOnlySlow(sentence)) continue
      if (id === 'heal' && isHealingReductionOnly(sentence)) continue

      const keywordRe = new RegExp(def.pattern.source, 'g')
      let keyword: RegExpExecArray | null
      while ((keyword = keywordRe.exec(sentence))) {
        // 「スタン効果時間」「スタン時間」は付与効果そのものではないため除外する。
        const afterText = sentence.slice(keyword.index + keyword[0].length)
        if (/^\s*の?\s*(?:効果)?(?:時間|持続時間)/.test(afterText)) {
          if (keyword[0].length === 0) keywordRe.lastIndex += 1
          continue
        }

        keywordMatches.push({
          id,
          start: keyword.index,
          end: keyword.index + keyword[0].length,
        })
        if (keyword[0].length === 0) keywordRe.lastIndex += 1
      }
    }

    if (keywordMatches.length === 0) continue

    // 効果キーワードごとに、直後の秒数を優先して紐づける。
    // 直後に秒数がない場合のみ直前の秒数を参照し、文中の代表秒数を
    // すべての効果へ一律に割り当てない。
    for (const keyword of keywordMatches) {
      const isDisplacement = DISPLACEMENT_CC_IDS.has(keyword.id)
      const limit = isDisplacement
        ? NEARBY_DISPLACEMENT_DISTANCE
        : NEARBY_JAPANESE_DURATION_DISTANCE
      const beforeLimit = isDisplacement ? Math.min(limit, 6) : limit

      let after: DurationSpan | null = null
      let afterDistance = Number.POSITIVE_INFINITY
      let before: DurationSpan | null = null
      let beforeDistance = Number.POSITIVE_INFINITY

      for (const span of durationSpans) {
        if (span.start >= keyword.end) {
          const distance = span.start - keyword.end
          if (distance <= limit && distance < afterDistance) {
            after = span
            afterDistance = distance
          }
        } else if (span.end <= keyword.start) {
          // 変位系CCは直前の秒数でも極端に近い場合のみ採用する。
          // 「6秒間スロウ…ノックバック」のようなスロー時間の流用を防ぐ。
          const distance = keyword.start - span.end
          if (distance <= beforeLimit && distance < beforeDistance) {
            before = span
            beforeDistance = distance
          }
        }
      }

      const chosen = after ?? before
      if (!chosen) continue

      const current = result.get(keyword.id) ?? 0
      if (chosen.max > current) result.set(keyword.id, chosen.max)
    }
  }

  return result
}

function extractJapaneseValueText(
  text: string,
  effectId: string,
): string | undefined {
  const def = EFFECT_DEF_BY_ID.get(effectId)
  if (!def) return undefined

  const sentence = splitSentences(text).find((item) => {
    if (effectId === 'slow' && isSelfOnlySlow(item)) return false
    if (effectId === 'heal' && isHealingReductionOnly(item)) return false
    return def.pattern.test(item)
  })

  if (!sentence) return undefined

  const percentages = sentence.match(/\d+(?:\.\d+)?\s*%/g)
  if (percentages && percentages.length > 0) {
    return [...new Set(percentages.map((value) => value.replace(/\s+/g, '')))].join(' / ')
  }

  const maximum = sentence.match(/最大\s*(\d+(?:\.\d+)?)/)
  if (maximum) return `最大${maximum[1]}`

  const stackValue = sentence.match(/(\d+(?:\.\d+)?)\s*スタック/)
  if (stackValue) return `${stackValue[1]}スタック`

  return undefined
}

/* ------------------------------------------------------------------ */
/* 英語（Meraki / CommunityDragon）からの効果抽出                       */
/* ------------------------------------------------------------------ */

function detectEnglishEffects(text: string, ability: any): Set<string> {
  const ids = new Set<string>()
  const lower = text.toLowerCase()
  const selfSlow = isSelfOnlySlowEnglish(lower)

  // 「～されない」「～無効」は付与効果ではないため CC 判定から除外
  const ccText = lower
    .replace(
      /cannot be (?:rooted|snared|slowed|stunned|knocked|disabled|immobilized|silenced|blinded|taunted|feared|charmed|suppressed|polymorphed)/g,
      ' ',
    )
    .replace(
      /\b(?:slow|stun|root|snare|silence|blind|taunt|fear|charm|suppression|knockup|knockback|polymorph|ground) immunity\b/g,
      ' ',
    )
    .replace(
      /immune to (?:slow|stun|root|snare|silence|blind|taunt|fear|charm|suppression|knockup|knockback|polymorph|ground)s?\b/g,
      ' ',
    )

  const hardPatterns: Record<string, RegExp> = {
    stun: /\bstun(?:s|ned|ning)?\b/,
    sleep:
      /\b(?:fall|falls|falling) asleep\b|\bputs? (?:them|the target|enemies|all enemy champions|nearby enemies) to sleep\b|\bsleeps? (?:them|the target|enemies|champions?)\b|\bdrowsy\b/,
    snare: /\broots?\b|\brooted\b|\brooting\b|\bsnares?\b|\bsnared\b/,
    knockup:
      /\bknock(?:s|ed|ing)?\s+(?:(?:them|all|nearby)\s+)?up\b|\bknock(?:s|ed|ing)?\s+(?:all\s+)?(?:enemies|champions?)\s+up\b|\bairborne\b|\bknocked into the air\b|\blaunch(?:es|ed)?\b[^.]{0,30}\bair\b/,
    knockback:
      /\bknock(?:s|ed|ing)?\s+(?:(?:them|all|nearby)\s+)?back\b|\bknockback\b/,
    suppression: /\bsuppress(?:es|ed|ing|ion)?\b/,
    charm: /\bcharm(?:s|ed|ing)?\b/,
    taunt: /\btaunt(?:s|ed|ing)?\b/,
    fear: /\bfear(?:s|ed|ing)?\b/,
    polymorph:
      /\bpolymorphs?\b[^.]{0,40}\b(?:them|enemies|target|champions?)\b|\bpolymorphing (?:them|enemies|the target)\b|\b(?:become|becomes|are|is) polymorphed\b/,
  }

  const softPatterns: Record<string, RegExp> = {
    slow: /\bslow(?:s|ed|ing)?\b/,
    silence:
      /\bsilences?\b[^.]{0,40}\b(?:them|enemies|target|champions?|units?)\b|\bsilencing (?:them|enemies|the target)\b|\b(?:enemies|targets?|champions?|units?) (?:are|is|be) silenced\b|\bapplies? silence\b/,
    blind:
      /\bblinds?\b[^.]{0,40}\b(?:them|enemies|target|champions?|units?)\b|\bblinding (?:them|enemies|the target)\b|\b(?:enemies|targets?|champions?|units?) (?:are|is|be) blinded\b|\bapplies? blind\b|\bnearsight(?:s|ed)?\b/,
    ground:
      /\bgrounds\b[^.]{0,30}\b(?:them|enemies|target|champions?|units?)\b|\b(?:become|becomes|becoming) grounded\b|\bgrounding (?:them|enemies|the target)\b|\bapplies? (?:a )?grounding\b/,
  }

  for (const [id, re] of Object.entries({ ...hardPatterns, ...softPatterns })) {
    if (id === 'slow' && selfSlow) continue
    if (re.test(ccText)) ids.add(id)
  }

  const healText = lower
    .replace(/healing (?:reduction|received)/g, '')
    .replace(/reduce[sd]? healing/g, '')

  if (
    /\bheals?\b|\bhealing\b|\brestores? (?:health|hp)\b|\blife ?steal\b|\bhealth regeneration\b/.test(
      healText,
    )
  ) {
    if (/\blife ?steal\b/.test(healText)) ids.add('lifesteal')
    if (/\bheals?\b|\bhealing\b|\brestores? (?:health|hp)\b|\bhealth regeneration\b/.test(healText)) {
      ids.add('heal')
    }
  }

  if (/\bshield(?:s|ed|ing)?\b|\bbarrier\b/.test(lower)) {
    const shieldText = lower.replace(
      /[^.]{0,60}\b(?:destroy|remove|break|steal|ignore)s?\b[^.]{0,60}\bshields?\b[^.]*\.?/g,
      '',
    )
    if (/\bshield(?:s|ed|ing)?\b|\bbarrier\b/.test(shieldText)) ids.add('shield')
  }

  const hasExplicitHaste =
    /\bbonus (?:movement|move) speed\b|\b(?:movement|move) speed (?:is|are) increased\b/.test(
      lower,
    )
  if (
    hasExplicitHaste ||
    (!selfSlow &&
      /\b(?:gain|gains|grant|grants|increase|increases|boost|boosts|empower|empowers)\b[^.]{0,50}\b(?:movement|move) speed\b|\bghosted\b|\bhaste\b/.test(
        lower,
      ))
  ) {
    ids.add('haste')
  }

  if (
    /\bbonus attack speed\b|\b(?:gain|gains|grant|grants|increase|increases|boost|boosts)\b[^.]{0,50}\battack speed\b/.test(
      lower,
    )
  ) {
    ids.add('attack_speed')
  }

  if (
    /invulnerab|\b(?:becomes?|becoming|remains?)\s+untargetable\b|\bunstoppable\b|\bcannot be (?:targeted|disabled|slowed|rooted|stunned)\b/.test(
      lower,
    )
  ) {
    ids.add('invulnerable')
  }

  if (
    /\bcc immunity\b|\bcrowd control immunity\b|\bimmune to (?:crowd control|disabling|cc)\b|\bcleanses? (?:himself|herself|themselves|all) (?:of )?(?:all )?crowd control\b/.test(
      lower,
    )
  ) {
    ids.add('cc_immunity')
  }

  if (
    /\bdamage reduction\b|\breduces? (?:incoming )?damage\b|\bdamage taken (?:is )?reduced\b/.test(
      lower,
    )
  ) {
    ids.add('damage_reduction')
  }

  if (
    /\b(?:increase[sd]?|gain[s]?|grant[s]?|boost[s]?)\b[^.]{0,60}\b(?:(?:maximum|max|bonus) health)\b|\b(?:maximum|max|bonus) health (?:is|are|gets?)\s+(?:increased|boosted)\b/.test(
      lower,
    )
  ) {
    ids.add('max_health')
  }

  if (
    /\b(?:increase[sd]?|gain[s]?|grant[s]?|boost[s]?)\b[^.]{0,60}\b(?:armor|magic resist)\b|\b(?:armor|magic resist) (?:is|are|gets?)\s+(?:increased|boosted)\b/.test(
      lower,
    )
  ) {
    ids.add('resistance')
  }

  if (
    /\b(?:increase[sd]?|gain[s]?|grant[s]?|boost[s]?)\b[^.]{0,120}\b(?:(?:attack )?range)\b|\b(?:attack )?range (?:is|are|gets?)\s+(?:increased|boosted)\b/.test(
      lower,
    )
  ) {
    ids.add('range')
  }

  if (
    /\bvision\b|\breveal(?:s|ed|ing)?\b|\bsight\b|\btrue sight\b|\bunobstructed vision\b/.test(
      lower,
    )
  ) {
    ids.add('vision')
  }

  if (/\binvisible\b|\binvisibility\b|\bstealth(?:ed)?\b/.test(lower)) {
    ids.add('invisibility')
  }

  if (
    /\b(?:destroy|block|intercept|negate)s?\b[^.]{0,60}\b(?:projectiles?|missiles?)\b/.test(
      lower,
    ) ||
    /\b(?:projectiles?|missiles?)\b[^.]{0,40}\b(?:destroy|block|intercept|negate)/.test(lower)
  ) {
    ids.add('projectile_block')
  }

  if (
    /\barmor (?:reduction|shred)\b|\breduces? (?:their|the target'?s?|target'?s? )?armor\b|\bshreds?\b[^.]{0,30}\barmor\b|\bresistances? reduction\b/.test(
      lower,
    )
  ) {
    ids.add('armor_shred')
  }

  if (
    /\bmagic resist(?:ance)? (?:reduction|shred)\b|\breduces? (?:their|the target'?s?|target'?s? )?magic resist(?:ance)?\b|\bresistances? reduction\b/.test(
      lower,
    )
  ) {
    ids.add('magic_shred')
  }

  if (/\battack speed (?:slow|reduction)\b|\breduces? (?:the target'?s? )?attack speed\b/.test(lower)) {
    ids.add('attack_speed_shred')
  }

  if (/grievous wounds?|healing reduction|reduces? healing|reduced healing/.test(lower)) {
    ids.add('grievous')
  }

  if (
    /\barmor penetration\b|\bbonus armor penetration\b|\bignores? \d+(?:\.\d+)?% of the target'?s? (?:bonus )?armor\b/.test(
      lower,
    )
  ) {
    ids.add('armor_pen')
  }

  if (/\bmagic penetration\b|\bbonus magic penetration\b/.test(lower)) {
    ids.add('magic_pen')
  }

  return ids
}

/* ------------------------------------------------------------------ */
/* 効果時間の抽出                                                       */
/* ------------------------------------------------------------------ */

interface DurationInfo {
  min: number
  max: number
}

function durationTagFromAttribute(
  attribute: string,
  effectIds: Set<string>,
): string | null {
  const a = attribute.toLowerCase()

  if (/disable duration|cc duration|crowd control duration/.test(a)) {
    return HARD_CC_PRIORITY.find((id) => effectIds.has(id)) ?? null
  }

  if (/effect duration|buff duration/.test(a)) {
    return BUFF_PRIORITY.find((id) => effectIds.has(id)) ?? null
  }

  const table: Array<[string, RegExp]> = [
    ['stun', /\bstun\b/],
    ['sleep', /\bsleep\b/],
    ['snare', /\broot|\bsnare|\bimmobiliz/],
    ['knockup', /\bknock.?up|\bairborne/],
    ['knockback', /\bknock.?back/],
    ['suppression', /\bsuppress/],
    ['charm', /\bcharm/],
    ['taunt', /\btaunt/],
    ['fear', /\bfear|\bflee/],
    ['polymorph', /\bpoly.?morph/],
    ['attack_speed_shred', /\battack speed (?:slow|reduction)/],
    ['attack_speed', /\battack speed/],
    ['armor_shred', /\barmor (?:reduction|shred)/],
    ['magic_shred', /\bmagic resist(?:ance)? (?:reduction|shred)/],
    ['armor_pen', /\barmor penetration/],
    ['magic_pen', /\bmagic penetration/],
    ['resistance', /\barmor|\bmagic resist/],
    ['silence', /\bsilence/],
    ['blind', /\bblind/],
    ['ground', /\bground/],
    ['slow', /\bslow/],
    ['shield', /\bshield|\bbarrier/],
    ['invulnerable', /\binvuln|\buntargetable|\bunstoppable/],
    ['cc_immunity', /\bcc immunity|crowd control immunity/],
    ['damage_reduction', /\bdamage reduction|damage taken/],
    ['haste', /\bmovement speed|\bmove speed|\bhaste/],
    ['heal', /\bheal|\brestore/],
    ['lifesteal', /\blife ?steal/],
    ['max_health', /\b(?:maximum|max|bonus) health/],
    ['range', /\brange/],
    ['grievous', /\bgrievous/],
    ['vision', /\bvision|\breveal|\bsight/],
    ['invisibility', /\binvisib|\bstealth/],
    ['projectile_block', /\bprojectile|\bmissile/],
  ]

  for (const [tag, re] of table) {
    if (re.test(a)) return tag
  }

  return null
}

function collectSeconds(leveling: any, attribute: string): number[] {
  const values: number[] = []
  const durationAttribute = /duration/i.test(attribute)

  for (const modifier of leveling?.modifiers ?? []) {
    const modValues = modifier?.values ?? []
    const units = modifier?.units ?? []

    modValues.forEach((value: unknown, index: number) => {
      const numeric = typeof value === 'number' ? value : Number(value)
      if (!Number.isFinite(numeric) || numeric <= 0) return

      const unit = String(units[index] ?? units[0] ?? '')
      const unitIsSeconds = /sec|second|^s$/i.test(unit)
      if (unitIsSeconds || (durationAttribute && unit === '')) {
        values.push(numeric)
      }
    })
  }

  return values
}

function collectMerakiDurations(
  ability: any,
  effectIds: Set<string>,
): Map<string, DurationInfo> {
  const result = new Map<string, DurationInfo>()

  for (const effect of ability?.effects ?? []) {
    for (const leveling of effect?.leveling ?? []) {
      const attribute = String(leveling?.attribute ?? '')
      const tag = durationTagFromAttribute(attribute, effectIds)
      if (!tag || !effectIds.has(tag)) continue

      const seconds = collectSeconds(leveling, attribute)
      if (seconds.length === 0) continue

      const info = { min: Math.min(...seconds), max: Math.max(...seconds) }
      const current = result.get(tag)
      if (!current || info.max > current.max) result.set(tag, info)
    }
  }

  return result
}

/** 効果ごとの英語キーワード。効果時間を「効果の近く」から拾うために使う。 */
const EN_EFFECT_KEYWORDS: Record<string, RegExp> = {
  stun: /\bstun/i,
  sleep: /\bsleep|\bdrowsy/i,
  snare: /\broot|\bsnare|\bimmobiliz/i,
  knockup: /\bknock.?up|\bairborne|\binto the air/i,
  knockback: /\bknock.?back/i,
  suppression: /\bsuppress/i,
  charm: /\bcharm/i,
  taunt: /\btaunt/i,
  fear: /\bfear|\bflee/i,
  polymorph: /\bpoly.?morph/i,
  slow: /\bslow/i,
  silence: /\bsilence/i,
  blind: /\bblind/i,
  ground: /\bground/i,
  shield: /\bshield|\bbarrier/i,
  haste: /\b(?:movement|move) speed|\bhaste/i,
  attack_speed: /\battack speed/i,
  attack_speed_shred: /\battack speed/i,
  heal: /\bheal|\brestore/i,
  lifesteal: /\blife ?steal/i,
  invulnerable: /\binvuln|\buntargetable|\bunstoppable/i,
  cc_immunity: /\bcc immunity|crowd control immunity|immune to crowd control|cleanses?/i,
  damage_reduction: /\bdamage reduction|damage taken/i,
  max_health: /\b(?:maximum|max) health/i,
  resistance: /\b(?:armor|magic resist)/i,
  range: /\battack range|\brange/i,
  vision: /\bvision|\breveal|\bsight/i,
  invisibility: /\binvisib|\bstealth/i,
  projectile_block: /\bprojectile|\bmissile/i,
  armor_shred: /\barmor/i,
  magic_shred: /\bmagic resist/i,
  grievous: /\bgrievous/i,
  armor_pen: /\barmor penetration/i,
  magic_pen: /\bmagic penetration/i,
}

function collectDescriptionDurations(
  ability: any,
  effectIds: Set<string>,
  stripNames: string[],
): Map<string, DurationInfo> {
  const result = new Map<string, DurationInfo>()
  const durationRe =
    /(?:for|over|lasts?|lasting)\s+(?:the next\s+|up to\s+)?(\d+(?:\.\d+)?(?:\s*(?:\/|:|-|−|–|to)\s*\d+(?:\.\d+)?)*)\s*(?:\([^)]*\)\s*)?(?:seconds?|secs?)\b/gi

  for (const effect of ability?.effects ?? []) {
    const description = stripAbilityNames(
      String(effect?.description ?? ''),
      stripNames,
    )
    if (!description) continue

    for (const sentence of description.split(/(?<=[.!?])\s+/)) {
      if (/cooldown|recharge/i.test(sentence)) continue

      const sentenceIds = detectEnglishEffects(sentence, ability)
      const matched = [...effectIds].filter((id) => sentenceIds.has(id))
      if (matched.length === 0) continue

      const durationSpans: DurationSpan[] = []
      durationRe.lastIndex = 0
      let match: RegExpExecArray | null
      while ((match = durationRe.exec(sentence))) {
        const values = (match[1].match(/\d+(?:\.\d+)?/g) ?? []).map(Number)
        const seconds = values.filter(
          (value) => Number.isFinite(value) && value > 0,
        )
        if (seconds.length === 0) continue

        durationSpans.push({
          start: match.index,
          end: match.index + match[0].length,
          min: Math.min(...seconds),
          max: Math.max(...seconds),
        })
      }

      if (durationSpans.length === 0) continue

      // 文内の各効果キーワード位置を収集する。
      const keywordMatches: Array<{
        id: string
        start: number
        end: number
      }> = []

      for (const id of matched) {
        const keywordRe = EN_EFFECT_KEYWORDS[id]
        if (!keywordRe) continue

        const globalRe = new RegExp(keywordRe.source, 'gi')
        let keyword: RegExpExecArray | null
        while ((keyword = globalRe.exec(sentence))) {
          // 「stun duration」など、効果そのものではなく効果時間の長さを
          // 指している語は持続時間の紐づけ対象から除外する。
          const afterText = sentence.slice(
            keyword.index + keyword[0].length,
          )
          if (/^\s+(?:duration|time)\b/i.test(afterText)) {
            if (keyword[0].length === 0) globalRe.lastIndex += 1
            continue
          }

          keywordMatches.push({
            id,
            start: keyword.index,
            end: keyword.index + keyword[0].length,
          })
          if (keyword[0].length === 0) globalRe.lastIndex += 1
        }
      }

      if (keywordMatches.length === 0) continue

      // 効果キーワードごとに、直後の秒数を優先して紐づける。
      // 変位系CCはキーワードより後ろに明記された秒数のみを採用し、
      // 直前にあるスキル全体の効果時間（例: 柱の6秒）を流用しない。
      for (const keyword of keywordMatches) {
        const isDisplacement = DISPLACEMENT_CC_IDS.has(keyword.id)
        const limit = isDisplacement
          ? NEARBY_ENGLISH_DISPLACEMENT_DISTANCE
          : NEARBY_DURATION_DISTANCE

        let after: DurationSpan | null = null
        let afterDistance = Number.POSITIVE_INFINITY
        let before: DurationSpan | null = null
        let beforeDistance = Number.POSITIVE_INFINITY

        for (const span of durationSpans) {
          if (span.start >= keyword.end) {
            const distance = span.start - keyword.end
            if (distance <= limit && distance < afterDistance) {
              after = span
              afterDistance = distance
            }
          } else if (!isDisplacement && span.end <= keyword.start) {
            const distance = keyword.start - span.end
            if (distance <= limit && distance < beforeDistance) {
              before = span
              beforeDistance = distance
            }
          }
        }

        const chosen = after ?? before
        if (!chosen) continue

        const current = result.get(keyword.id)
        const info = { min: chosen.min, max: chosen.max }
        if (!current || info.max > current.max) result.set(keyword.id, info)
      }
    }
  }

  return result
}

function extractMerakiValueText(
  ability: any,
  effectId: string,
  effectIds: Set<string>,
): string | undefined {
  for (const effect of ability?.effects ?? []) {
    for (const leveling of effect?.leveling ?? []) {
      const attribute = String(leveling?.attribute ?? '')
      const tag = durationTagFromAttribute(attribute, effectIds)
      if (tag !== effectId) continue
      if (/duration/i.test(attribute)) continue

      const modifier = leveling?.modifiers?.[0]
      const values = modifier?.values ?? []
      const units = modifier?.units ?? []
      if (!Array.isArray(values) || values.length === 0) continue

      const unit = String(units[0] ?? '')
      const text = values
        .map((value: unknown) => (typeof value === 'number' ? value : String(value)))
        .join(' / ')

      if (unit === '%') return `${text}%`
      if (unit.startsWith('%')) return `${text}${unit}`
      if (unit) return `${text} ${unit}`
      return text
    }
  }

  return undefined
}

/* ------------------------------------------------------------------ */
/* 発動タイプ / 解除可否                                                */
/* ------------------------------------------------------------------ */

function targetTypeFromMeraki(ability: any): TargetType | null {
  const targeting = String(ability?.targeting ?? '').toLowerCase()
  if (!targeting) return null

  if (targeting.includes('target') || targeting.includes('unit')) {
    return 'point_and_click'
  }
  if (
    targeting.includes('direction') ||
    targeting.includes('line') ||
    targeting.includes('vector')
  ) {
    return 'skillshot'
  }
  if (
    targeting.includes('location') ||
    targeting.includes('area') ||
    targeting.includes('circle') ||
    targeting.includes('cone') ||
    targeting.includes('point')
  ) {
    return 'aoe'
  }
  if (
    targeting.includes('self') ||
    targeting.includes('none') ||
    targeting.includes('passive')
  ) {
    return 'self'
  }

  return null
}

function detectJapaneseTargetType(
  text: string,
  isPassive: boolean,
): TargetType {
  const scores: Record<TargetType, number> = {
    point_and_click: 0,
    skillshot: 0,
    aoe: 0,
    self: 0,
  }

  const patterns: Array<[TargetType, RegExp, number]> = [
    ['point_and_click', /指定した敵|対象の敵|敵チャンピオン(?:1体|単体)|単体の敵|対象指定|クリック/, 3],
    ['point_and_click', /対象(?:に|へ)(?:ダメージ|スキル|攻撃)/, 1],
    ['skillshot', /方向(?:に|へ)|直線状|一直線|直線上|直線/, 3],
    ['skillshot', /発射|飛ば|投げ|放つ|矢|弾|ビーム|突き|貫通|扇状|ブーメラン/, 2],
    ['aoe', /範囲内|周囲|指定地点|地点|エリア|範囲(?:に|の)|近くの敵|付近|周辺/, 3],
    ['self', /自身|自分|味方(?:1体|チャンピオン)?(?:に|へ)|周囲の味方/, 2],
  ]

  for (const [type, re, weight] of patterns) {
    scores[type] += (text.match(re)?.length ?? 0) * weight
  }

  const order: TargetType[] = ['point_and_click', 'skillshot', 'aoe', 'self']
  let best: TargetType = isPassive ? 'self' : 'aoe'
  let bestScore = 0

  for (const type of order) {
    if (scores[type] > bestScore) {
      best = type
      bestScore = scores[type]
    }
  }

  return best
}

function computeCleanseFlags(effects: EffectDetail[]): {
  cleansable: boolean
  qssCleanse: boolean
} {
  const ccEffects = effects.filter(
    (effect) =>
      effect.category === 'hard_cc' || effect.category === 'soft_cc',
  )

  if (ccEffects.length === 0) {
    return { cleansable: false, qssCleanse: false }
  }

  return {
    cleansable: ccEffects.every(
      (effect) => !CLEANSE_IMMUNE_IDS.has(effect.id),
    ),
    qssCleanse: ccEffects.every((effect) => !QSS_IMMUNE_IDS.has(effect.id)),
  }
}

/* ------------------------------------------------------------------ */
/* チャンピオン / スキル生成                                            */
/* ------------------------------------------------------------------ */

function championIconUrl(version: string, image: string): string {
  return `${DDRAGON}/cdn/${version}/img/champion/${image}`
}

function spellIconUrl(version: string, image: string): string {
  return `${DDRAGON}/cdn/${version}/img/spell/${image}`
}

function passiveIconUrl(version: string, image: string): string {
  return `${DDRAGON}/cdn/${version}/img/passive/${image}`
}

function deriveLanes(positions: unknown, tags: string[]): Lane[] {
  const fromPositions = asArray(positions)
    .map((position) => LANE_LABELS[String(position).toUpperCase()])
    .filter((lane): lane is Lane => Boolean(lane))

  if (fromPositions.length > 0) {
    return [...new Set(fromPositions)].sort(
      (a, b) => LANES.indexOf(a) - LANES.indexOf(b),
    )
  }

  const derived = new Set<Lane>()
  for (const tag of tags) {
    switch (tag) {
      case 'Support':
        derived.add('Support')
        break
      case 'Marksman':
        derived.add('ADC')
        break
      case 'Mage':
        derived.add('Mid')
        break
      case 'Assassin':
        derived.add('Mid')
        derived.add('Jungle')
        break
      case 'Fighter':
        derived.add('Top')
        derived.add('Jungle')
        break
      case 'Tank':
        derived.add('Top')
        derived.add('Jungle')
        break
      default:
        break
    }
  }

  return [...derived].sort((a, b) => LANES.indexOf(a) - LANES.indexOf(b))
}

function buildEffects(
  championKey: string,
  slot: SkillKey,
  description: string,
  ability: any,
  effectIds: Set<string>,
  stripNames: string[],
): EffectDetail[] {
  const key = `${championKey}:${slot}`
  const remove = new Set(CURATED_REMOVE[key] ?? [])
  const curatedDurations = CURATED_DURATIONS[key] ?? {}

  const merakiDurations = ability
    ? collectMerakiDurations(ability, effectIds)
    : new Map<string, DurationInfo>()
  const descriptionDurations = ability
    ? collectDescriptionDurations(ability, effectIds, stripNames)
    : new Map<string, DurationInfo>()
  const japaneseDurations = collectJapaneseDurations(description, effectIds)

  const effects: EffectDetail[] = []

  for (const id of effectIds) {
    if (remove.has(id)) continue

    const def = EFFECT_DEF_BY_ID.get(id)
    if (!def) continue

    const parsedDuration =
      curatedDurations[id] ??
      merakiDurations.get(id)?.max ??
      descriptionDurations.get(id)?.max ??
      japaneseDurations.get(id)

    // ノックバックは固有の秒数が取れない場合や、スロー等の長時間を
    // 誤って流用している場合に、単体の標準値へフォールバックする。
    let duration = parsedDuration
    if (
      id === 'knockback' &&
      (duration === undefined || duration > MAX_KNOCKBACK_DURATION)
    ) {
      duration = DEFAULT_HARD_CC_DURATIONS[id]
    }

    const valueText =
      (ability ? extractMerakiValueText(ability, id, effectIds) : undefined) ??
      extractJapaneseValueText(description, id)

    effects.push({
      id,
      label: def.label,
      category: def.category,
      ...(duration && duration > 0 ? { duration: round(duration) } : {}),
      ...(valueText ? { valueText } : {}),
    })
  }

  effects.sort((a, b) => {
    const orderA = EFFECT_ORDER.get(a.id) ?? 999
    const orderB = EFFECT_ORDER.get(b.id) ?? 999
    return orderA - orderB
  })

  return effects
}

function round(value: number): number {
  return Math.round(value * 100) / 100
}

function buildSkill(params: {
  championKey: string
  championName: string
  championRole: string[]
  slot: SkillKey
  name: string
  description: string
  /** Data Dragon の生 tooltip（<physicalDamage> 等のタグを含む） */
  tooltip?: string
  iconUrl: string
  championIconUrl: string
  ability: any
  isPassive: boolean
  stripNames: string[]
}): SkillItem {
  const {
    championKey,
    championName,
    championRole,
    slot,
    name,
    description,
    tooltip,
    iconUrl,
    championIconUrl,
    ability,
    isPassive,
    stripNames,
  } = params

  const englishText = ability ? joinAbilityText(ability, stripNames) : ''
  const japaneseIds = detectJapaneseEffects(description)
  const englishIds = ability ? detectEnglishEffects(englishText, ability) : new Set<string>()
  const effectIds = new Set([...japaneseIds, ...englishIds])

  const effects = buildEffects(
    championKey,
    slot,
    description,
    ability,
    effectIds,
    stripNames,
  )

  const targetType =
    targetTypeFromMeraki(ability) ??
    detectJapaneseTargetType(description, isPassive)

  const { cleansable, qssCleanse } = computeCleanseFlags(effects)
  const damageTypes = detectDamageTypes(tooltip, description)

  return {
    id: `${championKey.toLowerCase()}-${slot.toLowerCase()}`,
    championKey,
    championName,
    championRole,
    key: slot,
    name,
    description,
    iconUrl,
    championIconUrl,
    targetType,
    damageTypes,
    cleansable,
    qssCleanse,
    effects,
  }
}

function buildChampion(
  version: string,
  detail: any,
  merakiChampion: any,
): ChampionProfile {
  const championKey = String(detail.id)
  const championName = String(detail.name)
  const roles = (detail.tags ?? []).map(
    (tag: string) => ROLE_LABELS[tag] ?? tag,
  )
  const lanes = deriveLanes(merakiChampion?.positions, detail.tags ?? [])
  const championIcon = championIconUrl(version, String(detail.image?.full ?? `${championKey}.png`))

  const stripNames: string[] = []
  for (const slot of SLOTS) {
    for (const form of merakiChampion?.abilities?.[slot] ?? []) {
      if (form?.name) stripNames.push(String(form.name))
    }
  }

  const skills: SkillItem[] = []

  // Passive
  const passive = detail.passive ?? {}
  const passiveDescription = resolveDdragonText(
    String(passive.description ?? ''),
  )
  const passiveAbility = merakiChampion?.abilities?.P?.[0] ?? null
  const passiveName = cleanHtml(String(passive.name ?? 'Passive'))
  const passiveDescriptionFinal =
    passiveDescription ||
    (passiveAbility ? cleanHtml(joinAbilityText(passiveAbility, stripNames)) : '')

  skills.push(
    buildSkill({
      championKey,
      championName,
      championRole: roles,
      slot: 'P',
      name: passiveName,
      description: passiveDescriptionFinal,
      tooltip: String(passive.description ?? ''),
      iconUrl: passiveIconUrl(version, String(passive.image?.full ?? '')),
      championIconUrl: championIcon,
      ability: passiveAbility,
      isPassive: true,
      stripNames,
    }),
  )

  // Q / W / E / R
  ACTIVE_SLOTS.forEach((slot, index) => {
    const spell = detail.spells?.[index]
    if (!spell) return

    const ability = merakiChampion?.abilities?.[slot]?.[0] ?? null
    const description = resolveDdragonText(
      String(spell.description ?? ''),
      spell.effectBurn,
    )
    const descriptionFinal =
      description ||
      (ability ? cleanHtml(joinAbilityText(ability, stripNames)) : '')

    skills.push(
      buildSkill({
        championKey,
        championName,
        championRole: roles,
        slot,
        name: cleanHtml(String(spell.name ?? slot)),
        description: descriptionFinal,
        tooltip: String(spell.tooltip ?? ''),
        iconUrl: spellIconUrl(version, String(spell.image?.full ?? '')),
        championIconUrl: championIcon,
        ability,
        isPassive: false,
        stripNames,
      }),
    )
  })

  return {
    championKey,
    championName,
    championIconUrl: championIcon,
    roles,
    lanes,
    skills,
  }
}

/* ------------------------------------------------------------------ */
/* main                                                                */
/* ------------------------------------------------------------------ */

async function main(): Promise<void> {
  console.log('Fetching Data Dragon versions...')
  const versions = await fetchJson(
    `${DDRAGON}/api/versions.json`,
    'ddragon-versions.json',
    WEEK_MS,
  )
  const version = String(versions[0])

  console.log(`Data Dragon ${version} / ${LOCALE}`)
  const index = await fetchJson(
    `${DDRAGON}/cdn/${version}/data/${LOCALE}/champion.json`,
    `ddragon-${version}-${LOCALE}-champion.json`,
    WEEK_MS,
  )

  console.log('Fetching community data (Meraki Analytics)...')
  let meraki: Record<string, any> = {}
  try {
    meraki = await fetchJson(MERAKI, 'meraki-champions.json', DAY_MS * 3)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.warn(`⚠ Meraki data unavailable, continuing with Data Dragon only: ${message}`)
  }

  const merakiByKey = new Map(
    Object.entries(meraki).map(([key, value]) => [key.toLowerCase(), value]),
  )
  const merakiById = new Map(
    Object.values(meraki).map((value: any) => [String(value.id), value]),
  )

  const entries = Object.values(index.data ?? {}) as any[]
  console.log(`Champions: ${entries.length} — fetching details (batch ${BATCH_SIZE})...`)

  let completed = 0
  const details = await mapLimit(entries, BATCH_SIZE, async (entry: any) => {
    const detail = await fetchJson(
      `${DDRAGON}/cdn/${version}/data/${LOCALE}/champion/${entry.id}.json`,
      `ddragon-${version}-${LOCALE}-${entry.id}.json`,
      WEEK_MS,
    )

    completed += 1
    if (completed % 20 === 0 || completed === entries.length) {
      console.log(`  fetched ${completed}/${entries.length}`)
    }

    return detail.data[entry.id]
  })

  console.log('Building champion profiles...')
  const champions = details.map((detail: any) => {
    const merakiChampion =
      merakiById.get(String(detail.key)) ??
      merakiByKey.get(String(detail.id).toLowerCase()) ??
      null

    return buildChampion(version, detail, merakiChampion)
  })

  champions.sort((a, b) =>
    a.championName.localeCompare(b.championName, 'ja'),
  )

  const skillCount = champions.reduce(
    (total, champion) => total + champion.skills.length,
    0,
  )

  if (champions.length < 150) {
    throw new Error(
      `Champion count is unexpectedly low: ${champions.length}. Data Dragon response may be incomplete.`,
    )
  }
  if (skillCount < 700) {
    throw new Error(
      `Skill count is unexpectedly low: ${skillCount}. Data Dragon response may be incomplete.`,
    )
  }

  const output = {
    meta: {
      version,
      locale: LOCALE,
      generatedAt: new Date().toISOString(),
      championCount: champions.length,
      skillCount,
      sources: [
        'Data Dragon (Riot Games) — champion / spell names, descriptions, images',
        'Meraki Analytics (community data) — crowd control, targeting, lanes and effect durations',
        'Japanese keyword parser — buff/debuff, target type and cleanse/QSS classification',
      ],
    },
    champions,
  }

  const json = JSON.stringify(output, null, 2)

  await fs.mkdir(path.dirname(OUT_FILE), { recursive: true })
  await fs.writeFile(OUT_FILE, `${json}\n`, 'utf8')

  const sizeMb = (Buffer.byteLength(json) / 1024 / 1024).toFixed(2)
  console.log(`✓ ${OUT_FILE}`)
  console.log(
    `  ${champions.length} champions / ${skillCount} skills / patch ${version} / ${sizeMb} MB`,
  )

  const missingSkills = champions.filter(
    (champion) => champion.skills.length < 5,
  )
  if (missingSkills.length > 0) {
    console.warn(
      `⚠ ${missingSkills.length} champions have fewer than 5 skills: ${missingSkills
        .map((champion) => champion.championKey)
        .join(', ')}`,
    )
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
