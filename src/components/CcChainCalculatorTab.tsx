import { useMemo, useState } from 'react'
import { ALL_SKILLS, CHAMPIONS, CHAMPION_BY_KEY, DEFAULT_CHAMPION_KEY } from '../data/champions'
import type { ChampionProfile } from '../types/champion'
import type { EffectDetail, SkillItem } from '../types/skill'
import {
  UNCLEANSABLE_CC_IDS,
  formatSeconds,
  getCcSkills,
  getPrimaryCcEffect,
} from '../utils/skillAnalysis'
import {
  EFFECT_CATEGORY_META,
  SKILL_KEY_STYLES,
  TARGET_TYPE_META,
} from '../features/skillSearch/meta'
import { ChampionCombobox } from './ChampionCombobox'
import { ChevronDownIcon, ClockIcon, SparkIcon, XIcon } from './Icons'

const SKILL_BY_ID = new Map(ALL_SKILLS.map((skill) => [skill.id, skill]))

interface ChainEntry {
  skill: SkillItem
  effect: EffectDetail
  duration: number
  hard: boolean
}

function buildChainEntries(
  chain: string[],
  slotA: ChampionProfile,
  slotB: ChampionProfile | null,
): ChainEntry[] {
  const allowedKeys = new Set(
    [slotA.championKey, slotB?.championKey].filter(
      (key): key is string => Boolean(key),
    ),
  )

  return chain
    .map((id) => SKILL_BY_ID.get(id))
    .filter(
      (skill): skill is SkillItem =>
        Boolean(skill && allowedKeys.has(skill.championKey)),
    )
    .map((skill) => {
      const effect = getPrimaryCcEffect(skill)
      if (!effect) return null

      return {
        skill,
        effect,
        duration: effect.duration ?? 0,
        hard: effect.category === 'hard_cc',
      }
    })
    .filter((entry): entry is ChainEntry => entry !== null)
}

function defaultChainFor(champion: ChampionProfile): string[] {
  return getCcSkills(champion.skills)
    .slice(0, 2)
    .map((skill) => skill.id)
}

function ChampionSlot({
  slotLabel,
  champion,
  otherKey,
  onChange,
  chain,
  onToggle,
  accent,
  onPickerOpenChange,
}: {
  slotLabel: string
  champion: ChampionProfile | null
  otherKey?: string
  onChange: (key: string) => void
  chain: string[]
  onToggle: (skillId: string) => void
  accent: 'gold' | 'cyan'
  onPickerOpenChange?: (open: boolean) => void
}) {
  const [comboboxOpen, setComboboxOpen] = useState(false)
  const ccSkills = champion ? getCcSkills(champion.skills) : []
  const accentText = accent === 'gold' ? 'text-[#F5D793]' : 'text-[#B5E4F7]'
  const accentBorder =
    accent === 'gold' ? 'border-[#C89B3C]/45' : 'border-[#5AB0E0]/45'

  const handlePickerOpenChange = (open: boolean) => {
    setComboboxOpen(open)
    onPickerOpenChange?.(open)
  }

  return (
    <div
      className={`rounded-xl border ${accentBorder} bg-[#0A1428]/65 p-3.5 ${
        comboboxOpen ? 'relative z-40' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#A09B8C]">
          {slotLabel}
        </span>
        {champion && (
          <span className="rounded border border-[#785A28]/40 bg-[#010A13]/60 px-1.5 py-0.5 text-[9px] text-[#A09B8C]">
            {champion.lanes.join(' / ')}
          </span>
        )}
      </div>

      <div className="mt-2">
        <ChampionCombobox
          value={champion?.championKey ?? ''}
          onChange={onChange}
          disabledKeys={otherKey ? [otherKey] : []}
          placeholder="チャンピオンを選択"
          ariaLabel={`${slotLabel}のチャンピオンを選択`}
          accent={accent}
          onOpenChange={handlePickerOpenChange}
        />
      </div>

      {champion ? (
        <>
          <div className="mt-3 flex items-center gap-2.5">
            <img
              src={champion.championIconUrl}
              alt={champion.championName}
              className={`h-11 w-11 shrink-0 rounded-full border-2 bg-[#0A1428] object-cover ${accentBorder}`}
              onError={(event) => {
                event.currentTarget.src = '/hex.svg'
              }}
            />
            <div className="min-w-0">
              <p className={`truncate text-sm font-bold ${accentText}`}>
                {champion.championName}
              </p>
              <p className="truncate text-[9px] uppercase tracking-wider text-[#A09B8C]">
                {champion.roles.join(' / ')}・CC {ccSkills.length} スキル
              </p>
            </div>
          </div>

          <div className="mt-3 space-y-1.5">
            {ccSkills.length > 0 ? (
              ccSkills.map((skill) => {
                const effect = getPrimaryCcEffect(skill)
                if (!effect) return null

                const active = chain.includes(skill.id)
                const meta = EFFECT_CATEGORY_META[effect.category]

                return (
                  <button
                    key={skill.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => onToggle(skill.id)}
                    className={`flex w-full items-center gap-2 rounded-lg border px-2 py-1.5 text-left transition ${
                      active
                        ? 'border-[#C89B3C]/70 bg-[#C89B3C]/12'
                        : 'border-[#785A28]/25 bg-[#010A13]/45 hover:border-[#C89B3C]/45 hover:bg-[#C89B3C]/[0.05]'
                    }`}
                  >
                    <span
                      className={`grid h-4 w-4 shrink-0 place-items-center rounded border text-[10px] font-bold ${
                        active
                          ? 'border-[#F5D793] bg-[#C89B3C] text-[#010A13]'
                          : 'border-[#785A28]/60 bg-[#010A13] text-transparent'
                      }`}
                    >
                      ✓
                    </span>
                    <span
                      className={`grid h-5 w-5 shrink-0 place-items-center rounded border text-[10px] font-bold ${SKILL_KEY_STYLES[skill.key]}`}
                    >
                      {skill.key}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[11px] font-semibold text-[#F0E6D2]">
                        {skill.name}
                      </span>
                      <span className="mt-0.5 flex flex-wrap items-center gap-1">
                        <span
                          className={`rounded border px-1 py-0.5 text-[8px] leading-none ${meta.badge}`}
                        >
                          {effect.label}
                        </span>
                        <span className="text-[9px] tabular-nums text-[#A09B8C]">
                          {formatSeconds(effect.duration ?? 0)}
                        </span>
                      </span>
                    </span>
                  </button>
                )
              })
            ) : (
              <p className="rounded-lg border border-dashed border-[#785A28]/30 px-2 py-3 text-center text-[10px] text-[#A09B8C]">
                CC効果を持つスキルがありません
              </p>
            )}
          </div>
        </>
      ) : (
        <p className="mt-3 rounded-lg border border-dashed border-[#785A28]/30 px-2 py-6 text-center text-[10px] text-[#A09B8C]">
          2体目のチャンピオンを追加できます
        </p>
      )}
    </div>
  )
}

export function CcChainCalculatorTab() {
  const [slotAKey, setSlotAKey] = useState(DEFAULT_CHAMPION_KEY)
  const [slotBKey, setSlotBKey] = useState('')
  const [openPickerSlot, setOpenPickerSlot] = useState<'A' | 'B' | null>(null)

  const slotA = CHAMPION_BY_KEY.get(slotAKey) ?? CHAMPIONS[0]
  const slotB = slotBKey ? (CHAMPION_BY_KEY.get(slotBKey) ?? null) : null

  const [chain, setChain] = useState<string[]>(() =>
    defaultChainFor(CHAMPION_BY_KEY.get(DEFAULT_CHAMPION_KEY) ?? CHAMPIONS[0]),
  )

  const handleSlotChange = (slot: 'A' | 'B', key: string) => {
    if (slot === 'A') setSlotAKey(key)
    else setSlotBKey(key)

    const nextKeys = new Set(
      [slot === 'A' ? key : slotAKey, slot === 'B' ? key : slotBKey].filter(
        Boolean,
      ),
    )

    setChain((previous) =>
      previous.filter((id) => {
        const skill = SKILL_BY_ID.get(id)
        return skill ? nextKeys.has(skill.championKey) : false
      }),
    )
  }

  const toggleSkill = (skillId: string) => {
    setChain((previous) =>
      previous.includes(skillId)
        ? previous.filter((id) => id !== skillId)
        : [...previous, skillId],
    )
  }

  const moveSkill = (index: number, direction: -1 | 1) => {
    setChain((previous) => {
      const next = [...previous]
      const target = index + direction
      if (target < 0 || target >= next.length) return previous

      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  const entries = useMemo(
    () => buildChainEntries(chain, slotA, slotB),
    [chain, slotA, slotB],
  )

  const totalDuration = entries.reduce(
    (total, entry) => total + entry.duration,
    0,
  )
  const hardDuration = entries
    .filter((entry) => entry.hard)
    .reduce((total, entry) => total + entry.duration, 0)
  const softDuration = totalDuration - hardDuration

  const axisMax = Math.max(10, Math.ceil(totalDuration))
  const ticks = Array.from(
    { length: Math.floor(axisMax / 2) + 1 },
    (_, index) => index * 2,
  )

  const hasKnockup = entries.some((entry) =>
    (UNCLEANSABLE_CC_IDS as readonly string[]).includes(entry.effect.id),
  )
  const allCleansable =
    entries.length > 0 && entries.every((entry) => entry.skill.cleansable)
  const requiresQss = entries.some(
    (entry) => !entry.skill.cleansable && entry.skill.qssCleanse,
  )

  const cleanseStatus = {
    label:
      entries.length === 0
        ? '未選択'
        : allCleansable
          ? 'クレンズで解除可能'
          : 'クレンズ単体では解除不可',
    detail:
      entries.length === 0
        ? 'CCスキルを選択してください'
        : allCleansable
          ? 'チェイン内のCCはすべてクレンズ対象です'
          : 'クレンズ対象外のCCが含まれています',
    tone:
      entries.length === 0
        ? 'border-[#785A28]/35 bg-[#0A1428]/60 text-[#A09B8C]'
        : allCleansable
          ? 'border-[#3FB68B]/50 bg-[#3FB68B]/10 text-[#9BE8C8]'
          : 'border-[#E0645A]/50 bg-[#E0645A]/10 text-[#FFB9AE]',
  }

  const qssStatus = {
    label:
      entries.length === 0
        ? '未選択'
        : hasKnockup
          ? 'QSSでも完全解除不可'
          : requiresQss
            ? 'QSS必須'
            : allCleansable
              ? 'QSS不要'
              : '解除不可',
    detail:
      entries.length === 0
        ? 'CCスキルを選択してください'
        : hasKnockup
          ? 'ノックアップ / ノックバックはQSSの対象外です'
          : requiresQss
            ? 'サプレッション等、QSSが必要なCCを含みます'
            : allCleansable
              ? 'すべてクレンズで解除できます'
              : '解除できないCCが含まれています',
    tone:
      entries.length === 0
        ? 'border-[#785A28]/35 bg-[#0A1428]/60 text-[#A09B8C]'
        : hasKnockup
          ? 'border-[#E0645A]/50 bg-[#E0645A]/10 text-[#FFB9AE]'
          : requiresQss
            ? 'border-[#C89B3C]/55 bg-[#C89B3C]/12 text-[#F5D793]'
            : 'border-[#3FB68B]/50 bg-[#3FB68B]/10 text-[#9BE8C8]',
  }

  const knockupStatus = {
    label:
      entries.length === 0
        ? '未選択'
        : hasKnockup
          ? 'ノックアップを含む'
          : 'ノックアップなし',
    detail:
      entries.length === 0
        ? 'CCスキルを選択してください'
        : hasKnockup
          ? '完全解除不能の拘束がチェインに含まれます'
          : 'すべて解除可能なCCで構成されています',
    tone:
      entries.length === 0
        ? 'border-[#785A28]/35 bg-[#0A1428]/60 text-[#A09B8C]'
        : hasKnockup
          ? 'border-[#E0645A]/50 bg-[#E0645A]/10 text-[#FFB9AE]'
          : 'border-[#3FB68B]/50 bg-[#3FB68B]/10 text-[#9BE8C8]',
  }

  return (
    <div className="space-y-5">
      <section
        className={`rounded-xl border border-[#785A28]/30 bg-[#091428]/75 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.25)] backdrop-blur sm:p-5 ${
          openPickerSlot ? 'relative z-40' : ''
        }`}
      >
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <SparkIcon className="h-3.5 w-3.5 text-[#C89B3C]" />
              <h2 className="font-display text-sm font-bold tracking-wide text-[#F0E6D2]">
                チャンピオン・スキル選択
              </h2>
            </div>
            <p className="mt-1 text-[10px] leading-relaxed text-[#A09B8C]">
              最大2体のチャンピオンから、CC効果を持つスキルを選んでチェインを組み立てます。
            </p>
          </div>
          <span className="rounded-full border border-[#785A28]/40 bg-[#0A1428]/60 px-2.5 py-1 text-[9px] tabular-nums text-[#A09B8C]">
            選択中 {entries.length} スキル
          </span>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
          <ChampionSlot
            slotLabel="チャンピオン A"
            champion={slotA}
            otherKey={slotBKey || undefined}
            onChange={(key) => handleSlotChange('A', key)}
            chain={chain}
            onToggle={toggleSkill}
            accent="gold"
            onPickerOpenChange={(open) =>
              setOpenPickerSlot((current) =>
                open ? 'A' : current === 'A' ? null : current,
              )
            }
          />
          <ChampionSlot
            slotLabel="チャンピオン B（任意）"
            champion={slotB}
            otherKey={slotAKey}
            onChange={(key) => handleSlotChange('B', key)}
            chain={chain}
            onToggle={toggleSkill}
            accent="cyan"
            onPickerOpenChange={(open) =>
              setOpenPickerSlot((current) =>
                open ? 'B' : current === 'B' ? null : current,
              )
            }
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              const removedKey = slotBKey
              setSlotBKey('')
              setChain((previous) =>
                previous.filter((id) => {
                  const skill = SKILL_BY_ID.get(id)
                  return skill ? skill.championKey !== removedKey : false
                }),
              )
            }}
            disabled={!slotB}
            className="rounded-lg border border-[#785A28]/40 bg-[#010A13]/55 px-3 py-1.5 text-[10px] font-semibold text-[#A09B8C] transition hover:border-[#C89B3C]/50 hover:text-[#F0E6D2] disabled:cursor-not-allowed disabled:opacity-40"
          >
            2体目を外す
          </button>
          <button
            type="button"
            onClick={() => setChain([])}
            disabled={entries.length === 0}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#785A28]/40 bg-[#010A13]/55 px-3 py-1.5 text-[10px] font-semibold text-[#A09B8C] transition hover:border-[#C89B3C]/50 hover:text-[#F0E6D2] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <XIcon className="h-3 w-3" />
            チェインをクリア
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-[#785A28]/30 bg-[#091428]/75 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.25)] backdrop-blur sm:p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <ClockIcon className="h-3.5 w-3.5 text-[#C89B3C]" />
              <h2 className="font-display text-sm font-bold tracking-wide text-[#F0E6D2]">
                拘束タイムライン
              </h2>
            </div>
            <p className="mt-1 text-[10px] leading-relaxed text-[#A09B8C]">
              選択した順にCC時間を連結表示しています。0.0秒から最大10秒以上まで自動で拡張されます。
            </p>
          </div>

          <div className="text-right">
            <p className="text-[9px] uppercase tracking-[0.18em] text-[#A09B8C]">
              合計拘束時間
            </p>
            <p className="text-2xl font-bold tabular-nums text-[#F5D793] sm:text-3xl">
              ⚡ {totalDuration.toFixed(1)}
              <span className="ml-1 text-sm font-semibold text-[#C89B3C]">秒</span>
            </p>
            <p className="mt-0.5 text-[9px] tabular-nums text-[#A09B8C]">
              ハードCC {hardDuration.toFixed(1)}秒 / ソフトCC {softDuration.toFixed(1)}秒
            </p>
          </div>
        </div>

        {entries.length > 0 ? (
          <>
            <div className="mt-4 overflow-hidden rounded-lg border border-[#785A28]/35 bg-[#010A13]/70">
              <div className="relative">
                <div className="flex h-14 w-full">
                  {entries.map((entry, index) => {
                    const width = (entry.duration / axisMax) * 100
                    const tone = entry.hard
                      ? 'from-[#E0645A] to-[#8E3830] border-[#FFB9AE]/30'
                      : 'from-[#6FB7D9] to-[#2E6B8A] border-[#B5E4F7]/30'

                    return (
                      <div
                        key={`${entry.skill.id}-${index}`}
                        title={`${entry.skill.championName} ${entry.skill.key} ${entry.skill.name} / ${entry.effect.label} ${formatSeconds(entry.duration)}`}
                        style={{ width: `${width}%` }}
                        className={`relative flex min-w-[2px] flex-col justify-center overflow-hidden border-r border-[#010A13]/60 bg-gradient-to-b px-1.5 text-[#FFF5E6] last:border-r-0 ${tone}`}
                      >
                        <span className="truncate text-[9px] font-bold leading-tight drop-shadow">
                          {entry.skill.key} {entry.effect.label}
                        </span>
                        <span className="truncate text-[8px] leading-tight opacity-80">
                          {entry.skill.championName}・{entry.duration.toFixed(1)}s
                        </span>
                      </div>
                    )
                  })}
                </div>

                {ticks.map((tick) => (
                  <div
                    key={tick}
                    className="pointer-events-none absolute inset-y-0 w-px bg-[#F0E6D2]/10"
                    style={{ left: `${(tick / axisMax) * 100}%` }}
                  />
                ))}
              </div>

              <div className="relative h-5 border-t border-[#785A28]/25">
                {ticks.map((tick) => (
                  <span
                    key={tick}
                    className="absolute top-1 -translate-x-1/2 text-[8px] tabular-nums text-[#A09B8C] first:translate-x-0"
                    style={{ left: `${(tick / axisMax) * 100}%` }}
                  >
                    {tick.toFixed(0)}s
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-3 text-[9px] text-[#A09B8C]">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-4 rounded-sm bg-gradient-to-b from-[#E0645A] to-[#8E3830]" />
                ハードCC
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-4 rounded-sm bg-gradient-to-b from-[#6FB7D9] to-[#2E6B8A]" />
                ソフトCC
              </span>
              <span className="ml-auto">※ 取得済み効果時間による簡易シミュレーション</span>
            </div>
          </>
        ) : (
          <div className="mt-4 flex min-h-[130px] flex-col items-center justify-center rounded-lg border border-dashed border-[#785A28]/40 bg-[#010A13]/45 px-4 text-center">
            <p className="text-[11px] font-semibold text-[#F0E6D2]">
              スキルを選択するとタイムラインが表示されます
            </p>
            <p className="mt-1 text-[10px] text-[#A09B8C]">
              上のスロットからCCスキルをクリックしてチェインに追加してください。
            </p>
          </div>
        )}
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { title: 'クレンズ判定', status: cleanseStatus },
          { title: 'QSS判定', status: qssStatus },
          { title: 'ノックアップ判定', status: knockupStatus },
        ].map((item) => (
          <div
            key={item.title}
            className="rounded-xl border border-[#785A28]/30 bg-[#0A1428]/60 p-3.5"
          >
            <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#A09B8C]">
              {item.title}
            </p>
            <span
              className={`mt-2 inline-flex rounded-lg border px-2.5 py-1 text-[11px] font-bold ${item.status.tone}`}
            >
              {item.status.label}
            </span>
            <p className="mt-2 text-[10px] leading-relaxed text-[#A09B8C]">
              {item.status.detail}
            </p>
          </div>
        ))}
      </section>

      {entries.length > 0 && (
        <section className="rounded-xl border border-[#785A28]/30 bg-[#091428]/75 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.25)] backdrop-blur sm:p-5">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="font-display text-sm font-bold tracking-wide text-[#F0E6D2]">
                チェイン順序
              </h2>
              <p className="mt-1 text-[10px] leading-relaxed text-[#A09B8C]">
                上下ボタンで発動順を並べ替えると、タイムラインと合計時間に即時反映されます。
              </p>
            </div>
            <span className="rounded-full border border-[#785A28]/40 bg-[#0A1428]/60 px-2.5 py-1 text-[9px] text-[#A09B8C]">
              {entries.length} ステップ
            </span>
          </div>

          <ol className="mt-3 space-y-1.5">
            {entries.map((entry, index) => {
              const meta = EFFECT_CATEGORY_META[entry.effect.category]
              const targetMeta = TARGET_TYPE_META[entry.skill.targetType]

              return (
                <li
                  key={`${entry.skill.id}-${index}`}
                  className="flex flex-wrap items-center gap-2 rounded-lg border border-[#785A28]/25 bg-[#010A13]/50 px-2.5 py-2 sm:flex-nowrap"
                >
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-[#C89B3C]/50 bg-[#C89B3C]/10 text-[10px] font-bold tabular-nums text-[#F5D793]">
                    {index + 1}
                  </span>
                  <img
                    src={entry.skill.championIconUrl}
                    alt={entry.skill.championName}
                    loading="lazy"
                    onError={(event) => {
                      event.currentTarget.src = '/hex.svg'
                    }}
                    className="h-7 w-7 shrink-0 rounded-full border border-[#785A28]/50 bg-[#0A1428] object-cover"
                  />
                  <span
                    className={`grid h-5 w-5 shrink-0 place-items-center rounded border text-[10px] font-bold ${SKILL_KEY_STYLES[entry.skill.key]}`}
                  >
                    {entry.skill.key}
                  </span>
                  <div className="min-w-0 flex-1 basis-[140px]">
                    <p className="truncate text-[11px] font-semibold text-[#F0E6D2]">
                      {entry.skill.championName}・{entry.skill.name}
                    </p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1">
                      <span
                        className={`rounded border px-1 py-0.5 text-[8px] leading-none ${meta.badge}`}
                      >
                        {entry.effect.label}
                      </span>
                      <span
                        className={`rounded border px-1 py-0.5 text-[8px] leading-none ${targetMeta.badge}`}
                      >
                        {targetMeta.label}
                      </span>
                      <span className="text-[9px] tabular-nums text-[#A09B8C]">
                        {formatSeconds(entry.duration)}
                      </span>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => moveSkill(index, -1)}
                      disabled={index === 0}
                      aria-label={`${entry.skill.name}を上へ移動`}
                      className="grid h-6 w-6 place-items-center rounded border border-[#785A28]/40 bg-[#010A13]/60 text-[#A09B8C] transition hover:border-[#C89B3C]/60 hover:text-[#F0E6D2] disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <ChevronDownIcon className="h-3 w-3 rotate-180" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveSkill(index, 1)}
                      disabled={index === entries.length - 1}
                      aria-label={`${entry.skill.name}を下へ移動`}
                      className="grid h-6 w-6 place-items-center rounded border border-[#785A28]/40 bg-[#010A13]/60 text-[#A09B8C] transition hover:border-[#C89B3C]/60 hover:text-[#F0E6D2] disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <ChevronDownIcon className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleSkill(entry.skill.id)}
                      aria-label={`${entry.skill.name}をチェインから削除`}
                      className="grid h-6 w-6 place-items-center rounded border border-[#785A28]/40 bg-[#010A13]/60 text-[#A09B8C] transition hover:border-[#E0645A]/60 hover:text-[#FFB9AE]"
                    >
                      <XIcon className="h-3 w-3" />
                    </button>
                  </div>
                </li>
              )
            })}
          </ol>
        </section>
      )}
    </div>
  )
}
