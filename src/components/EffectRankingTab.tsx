import { useMemo, useState } from 'react'
import { ALL_SKILLS } from '../data/champions'
import {
  RANKING_METRICS,
  buildEffectRanking,
  isUncleansableCc,
  type RankingMetric,
} from '../utils/skillAnalysis'
import { SKILL_KEY_STYLES, TARGET_TYPE_META } from '../features/skillSearch/meta'
import { SparkIcon } from './Icons'
import type { SkillItem } from '../types/skill'

function rankBadgeClass(rank: number): string {
  if (rank === 1) {
    return 'border-[#E8B84B]/80 bg-gradient-to-br from-[#E8B84B]/35 to-[#785A28]/20 text-[#FFF0C2] shadow-[0_0_14px_rgba(232,184,75,0.25)]'
  }
  if (rank === 2) {
    return 'border-[#B9C4CC]/70 bg-gradient-to-br from-[#B9C4CC]/30 to-[#5A6670]/20 text-[#E8EEF2]'
  }
  if (rank === 3) {
    return 'border-[#B87333]/70 bg-gradient-to-br from-[#B87333]/30 to-[#5C3417]/20 text-[#F0C29A]'
  }
  return 'border-[#785A28]/40 bg-[#0A1428]/70 text-[#A09B8C]'
}

function cleanseBadge(skill: SkillItem): { label: string; className: string } {
  if (isUncleansableCc(skill)) {
    return {
      label: '解除不能',
      className: 'border-[#E0645A]/50 bg-[#E0645A]/12 text-[#FFB9AE]',
    }
  }
  if (skill.cleansable) {
    return {
      label: 'クレンズ可',
      className: 'border-[#3FB68B]/45 bg-[#3FB68B]/10 text-[#9BE8C8]',
    }
  }
  if (skill.qssCleanse) {
    return {
      label: 'QSSのみ',
      className: 'border-[#C89B3C]/50 bg-[#C89B3C]/12 text-[#F5D793]',
    }
  }
  return {
    label: '解除不能',
    className: 'border-[#785A28]/45 bg-[#785A28]/10 text-[#A09B8C]',
  }
}

export function EffectRankingTab() {
  const [metric, setMetric] = useState<RankingMetric>('hard_cc')

  const metricMeta = RANKING_METRICS.find((item) => item.id === metric) ?? RANKING_METRICS[0]

  const entries = useMemo(() => buildEffectRanking(ALL_SKILLS, metric, 10), [metric])

  const maxValue = entries[0]?.value ?? 1

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-[#785A28]/30 bg-[#091428]/75 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.25)] backdrop-blur sm:p-5">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <SparkIcon className="h-3.5 w-3.5 text-[#C89B3C]" />
              <h2 className="font-display text-sm font-bold tracking-wide text-[#F0E6D2]">
                ランキング指標を選択
              </h2>
            </div>
            <p className="mt-1 text-[10px] leading-relaxed text-[#A09B8C]">
              全チャンピオンのスキルから、指定した効果数値が大きい順に TOP10 を表示します。
            </p>
          </div>
          <span className="rounded-full border border-[#785A28]/40 bg-[#0A1428]/60 px-2.5 py-1 text-[9px] tabular-nums text-[#A09B8C]">
            集計対象 {ALL_SKILLS.length} スキル
          </span>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-1.5 sm:grid-cols-2 xl:grid-cols-4">
          {RANKING_METRICS.map((item) => {
            const active = item.id === metric

            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={active}
                onClick={() => setMetric(item.id)}
                className={`rounded-lg border px-3 py-2.5 text-left transition ${
                  active
                    ? 'border-[#C89B3C]/80 bg-[#C89B3C]/15 shadow-[0_0_18px_rgba(200,155,60,0.12)]'
                    : 'border-[#785A28]/30 bg-[#010A13]/55 hover:border-[#C89B3C]/50 hover:bg-[#C89B3C]/[0.06]'
                }`}
              >
                <span
                  className={`block text-[11px] font-bold ${
                    active ? 'text-[#F5D793]' : 'text-[#F0E6D2]'
                  }`}
                >
                  {item.label}
                </span>
                <span className="mt-0.5 block text-[9px] leading-relaxed text-[#A09B8C]">
                  {item.description}
                </span>
              </button>
            )
          })}
        </div>
      </section>

      <section>
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex flex-wrap items-baseline gap-2">
              <h2 className="font-display text-base font-bold tracking-wide text-[#F0E6D2] sm:text-lg">
                {metricMeta.label}
              </h2>
              <span className="text-2xl font-bold tabular-nums text-[#C89B3C]">
                TOP {entries.length}
              </span>
            </div>
            <p className="mt-1 text-[10px] leading-relaxed text-[#A09B8C]">
              {metricMeta.description}。同値の場合は効果時間が長いスキルを上位に表示します。
            </p>
          </div>

          <span className="shrink-0 rounded-full border border-[#785A28]/40 bg-[#0A1428]/60 px-2.5 py-1 text-[9px] text-[#A09B8C]">
            降順 / 単位: {metricMeta.unit}
          </span>
        </div>

        {entries.length > 0 ? (
          <ol className="space-y-1.5">
            {entries.map((entry, index) => {
              const rank = index + 1
              const skill = entry.skill
              const targetMeta = TARGET_TYPE_META[skill.targetType]
              const cleanse = cleanseBadge(skill)
              const ratio = Math.max(6, Math.round((entry.value / maxValue) * 100))

              return (
                <li
                  key={`${skill.id}-${entry.effectLabel}`}
                  className={`card-enter relative overflow-hidden rounded-xl border px-3 py-2.5 transition sm:px-4 ${
                    rank <= 3
                      ? 'border-[#C89B3C]/40 bg-[#0F1923]/90'
                      : 'border-[#785A28]/25 bg-[#0A1428]/70 hover:border-[#C89B3C]/45'
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2 sm:flex-nowrap">
                    <span
                      className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg border text-[13px] font-bold tabular-nums ${rankBadgeClass(rank)}`}
                    >
                      {rank}
                    </span>

                    <img
                      src={skill.championIconUrl}
                      alt={skill.championName}
                      loading="lazy"
                      onError={(event) => {
                        event.currentTarget.src = '/hex.svg'
                      }}
                      className="h-10 w-10 shrink-0 rounded-full border border-[#C89B3C]/50 bg-[#0A1428] object-cover"
                    />

                    <div className="min-w-0 flex-1 basis-[150px]">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-xs font-bold text-[#F0E6D2]">
                          {skill.championName}
                        </span>
                        <span
                          className={`grid h-5 w-5 shrink-0 place-items-center rounded border text-[10px] font-bold ${SKILL_KEY_STYLES[skill.key]}`}
                        >
                          {skill.key}
                        </span>
                      </div>
                      <p className="truncate text-[10px] text-[#C7C1B4]">{skill.name}</p>
                    </div>

                    <div className="flex shrink-0 flex-wrap items-center gap-1">
                      <span
                        className={`rounded border px-1.5 py-0.5 text-[9px] leading-none ${targetMeta.badge}`}
                      >
                        {targetMeta.label}
                      </span>
                      <span
                        className={`rounded border px-1.5 py-0.5 text-[9px] leading-none ${cleanse.className}`}
                      >
                        {cleanse.label}
                      </span>
                    </div>

                    <div className="min-w-[112px] shrink-0 text-right sm:min-w-[132px]">
                      <span
                        className={`text-xl font-bold tabular-nums sm:text-2xl ${
                          rank === 1 ? 'text-[#F5D793]' : 'text-[#E4C784]'
                        }`}
                      >
                        {entry.displayValue}
                      </span>
                      <span className="mt-0.5 block truncate text-[9px] text-[#A09B8C]">
                        {entry.effectLabel}
                        {entry.note && entry.note !== entry.effectLabel
                          ? ` / ${entry.note}`
                          : ''}
                      </span>
                    </div>
                  </div>

                  <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-[#010A13]">
                    <div
                      className={`h-full rounded-full ${
                        rank === 1
                          ? 'bg-gradient-to-r from-[#785A28] via-[#C89B3C] to-[#FFF0C2]'
                          : 'bg-gradient-to-r from-[#785A28]/70 to-[#C89B3C]/80'
                      }`}
                      style={{ width: `${ratio}%` }}
                    />
                  </div>
                </li>
              )
            })}
          </ol>
        ) : (
          <div className="flex min-h-[240px] flex-col items-center justify-center rounded-xl border border-dashed border-[#785A28]/40 bg-[#091428]/40 px-6 text-center">
            <div className="grid h-14 w-14 place-items-center rounded-full border border-[#785A28]/50 bg-[#0A1428] text-[#C89B3C]">
              <SparkIcon className="h-6 w-6" />
            </div>
            <h3 className="mt-3 text-sm font-bold text-[#F0E6D2]">
              この指標に該当するスキルがありません
            </h3>
            <p className="mt-1 max-w-sm text-[11px] leading-relaxed text-[#A09B8C]">
              別の指標を選択してください。
            </p>
          </div>
        )}
      </section>
    </div>
  )
}
