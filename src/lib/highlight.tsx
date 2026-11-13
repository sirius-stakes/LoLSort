import type { ReactNode } from 'react'
import type { EffectDetail } from '../types/skill'
import { TAGS, type TagId } from '../data/tags'

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * スキル説明文のうち、付与タグに関連するキーワードを <mark> で強調する。
 */
export function highlightDescription(text: string, tags: string[]): ReactNode {
  const keywords = Array.from(
    new Set(
      tags.flatMap((tag) => {
        const definition = TAGS[tag as TagId]
        return definition ? [definition.label, ...definition.synonyms] : []
      }),
    ),
  )
    .filter((keyword) => keyword.length >= 2)
    .sort((a, b) => b.length - a.length)

  if (!keywords.length) return text

  const matcher = new RegExp(`(${keywords.map(escapeRegExp).join('|')})`, 'gi')
  const parts = text.split(matcher)
  const keywordSet = new Set(keywords.map((keyword) => keyword.toLowerCase()))

  return parts.map((part, index) => {
    if (!keywordSet.has(part.toLowerCase())) return part
    return (
      <mark
        key={`${part}-${index}`}
        className="rounded-[3px] bg-[#C89B3C]/20 px-0.5 font-medium text-[#F5D793]"
      >
        {part}
      </mark>
    )
  })
}

/* ------------------------------------------------------------------ */
/* スキル効果タグに基づく説明文ハイライト                              */
/* ------------------------------------------------------------------ */

/**
 * 効果IDごとの言い換え。
 * 説明文では「スロウ」「移動速度を奪う」など表記が揺れるため、
 * タグ名だけでなく代表的な言い回しもハイライト対象にする。
 */
const EFFECT_KEYWORD_ALIASES: Record<string, string[]> = {
  slow: ['スロー', 'スロウ', '移動速度低下', '移動速度が低下', '移動速度を低下', '移動速度を奪う', '移動速度', '減速'],
  haste: ['移動速度増加', '移動速度が増加', '移動速度上昇', '移動速度'],
  stun: ['スタン', '気絶'],
  snare: ['スネア', '拘束', 'バインド'],
  knockup: ['ノックアップ', '打ち上げ'],
  knockback: ['ノックバック', '吹き飛ばし'],
  suppression: ['サプレッション', '抑圧'],
  silence: ['サイレンス', '沈黙'],
  polymorph: ['ポリモーフ', '変身', '無力化'],
  charm: ['チャーム', '魅了'],
  taunt: ['タウント', '挑発'],
  fear: ['フィアー', '恐怖'],
  sleep: ['スリープ', '眠り'],
  ground: ['グラウンド', '接地'],
  shield: ['シールド', 'バリア'],
  heal: ['体力回復', '体力を回復', '回復'],
  lifesteal: ['ライフスティール', '体力吸収'],
  attack_speed: ['攻撃速度増加', '攻撃速度が増加', '攻撃速度上昇', '攻撃速度'],
  attack_speed_shred: ['攻撃速度低下', '攻撃速度が低下', '攻撃速度'],
  armor_shred: ['物理防御低下', '物理防御を低下', '物理防御が低下', '物理防御'],
  magic_shred: ['魔法防御低下', '魔法防御を低下', '魔法防御が低下', '魔法防御'],
  armor_pen: ['物理防御貫通', '防御貫通'],
  grievous: ['重傷'],
  cc_immunity: ['行動妨害無効', '行動妨害解除', '行動妨害', 'CC無効'],
  invulnerable: ['無敵'],
  invisibility: ['インビジブル', 'ステルス'],
  damage_reduction: ['ダメージ軽減'],
  projectile_block: ['発射物無効', '発射物', '投射物'],
  resistance: ['物理防御増加', '魔法防御増加', '防御力増加', '物理防御', '魔法防御'],
  max_health: ['最大体力増加', '最大体力が増加', '最大体力'],
  range: ['射程増加', '射程距離', '射程'],
  vision: ['視界確保', '視界', '可視'],
  pix_bolt: ['追加魔法ダメージ', '魔法のビーム'],
}

/** 秒数・割合・スタック数などの数値表現 */
const NUMBER_PATTERN =
  '\\d+(?:\\.\\d+)?\\s*(?:秒|%|スタック|体|回|発)'

/**
 * ダメージ属性のキーワード。LoL 公式の表記色に合わせて
 * 物理 = オレンジ / 魔法 = シアン / 確定 = ホワイトで強調する。
 */
const DAMAGE_KEYWORD_STYLES: Record<string, string> = {
  物理ダメージ:
    'rounded-[3px] bg-orange-950/60 px-0.5 font-semibold text-orange-400',
  魔法ダメージ:
    'rounded-[3px] bg-sky-950/60 px-0.5 font-semibold text-sky-400',
  確定ダメージ:
    'rounded-[3px] bg-slate-700/80 px-0.5 font-semibold text-slate-100',
}

function collectSkillKeywords(effects: EffectDetail[]): string[] {
  const keywords = new Set<string>()

  for (const effect of effects) {
    keywords.add(effect.label)
    for (const alias of EFFECT_KEYWORD_ALIASES[effect.id] ?? []) {
      keywords.add(alias)
    }
  }

  return Array.from(keywords)
    .filter((keyword) => keyword.length >= 2)
    .sort((a, b) => b.length - a.length)
}

/**
 * スキル説明文の効果キーワードと数値部分を Hextech ゴールド調で強調する。
 * 効果タグの表示名・類義語・秒数 / % 表記をまとめて検出する。
 */
export function highlightSkillDescription(
  text: string,
  effects: EffectDetail[],
): ReactNode {
  const keywords = [
    ...collectSkillKeywords(effects),
    ...Object.keys(DAMAGE_KEYWORD_STYLES),
  ]
    .filter((keyword, index, list) => list.indexOf(keyword) === index)
    .sort((a, b) => b.length - a.length)

  const alternatives = [...keywords.map(escapeRegExp), NUMBER_PATTERN]

  if (alternatives.length === 0) return text

  const matcher = new RegExp(`(${alternatives.join('|')})`, 'gi')
  const parts = text.split(matcher)

  return parts.map((part, index) => {
    // キャプチャグループに一致した部分は奇数インデックスに入る
    if (index % 2 === 0 || part.length === 0) return part

    const damageStyle = DAMAGE_KEYWORD_STYLES[part]

    return (
      <mark
        key={`${part}-${index}`}
        className={
          damageStyle ??
          'rounded-[3px] bg-[#C89B3C]/12 px-0.5 font-semibold text-[#F5D793]'
        }
      >
        {part}
      </mark>
    )
  })
}
