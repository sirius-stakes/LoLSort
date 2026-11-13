import type { ChampionProfile } from '../../types/champion'
import type { EffectCategory, SkillItem, SkillKey } from '../../types/skill'
import type { SimilarityResult } from '../../utils/championSimilarity'
import { ChevronDownIcon } from '../../components/Icons'
import {
  EFFECT_CATEGORY_META,
  SKILL_KEY_STYLES,
  TARGET_TYPE_META,
} from '../skillSearch/meta'

const COMPARE_KEYS: SkillKey[] = ['Q', 'W', 'E', 'R']

function formatWeight(weight: number): string {
  return Number.isInteger(weight) ? `+${weight}` : `+${weight.toFixed(1)}`
}

function scoreTone(score: number): string {
  if (score >= 70) {
    return 'border-[#3FB68B]/60 bg-[#3FB68B]/12 text-[#9BE8C8]'
  }
  if (score >= 40) {
    return 'border-[#C89B3C]/60 bg-[#C89B3C]/12 text-[#F5D793]'
  }
  return 'border-[#785A28]/50 bg-[#785A28]/10 text-[#E4C784]'
}

function SkillMiniView({
  skill,
  matchedCategories,
}: {
  skill: SkillItem | undefined
  matchedCategories: EffectCategory[]
}) {
  if (!skill) {
    return <p className="text-[10px] text-[#A09B8C]/50">該当スキルなし</p>
  }

  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-1">
        <span className="truncate text-[10px] font-semibold text-[#F0E6D2]">
          {skill.name}
        </span>
        <span
          className={`shrink-0 rounded border px-1 py-0.5 text-[8px] leading-none ${TARGET_TYPE_META[skill.targetType].badge}`}
        >
          {TARGET_TYPE_META[skill.targetType].label}
        </span>
      </div>

      <div className="mt-1 flex flex-wrap gap-1">
        {skill.effects.length > 0 ? (
          skill.effects.map((effect, index) => {
            const matched = matchedCategories.includes(effect.category)
            const meta = EFFECT_CATEGORY_META[effect.category]

            return (
              <span
                key={`${effect.id}-${index}`}
                title={`${effect.label}（${meta.label}）`}
                className={`rounded border px-1 py-0.5 text-[8px] leading-none ${
                  matched
                    ? `${meta.badge} ring-1 ring-[#F5D793]/40`
                    : 'border-[#785A28]/25 bg-[#0A1428]/50 text-[#A09B8C]'
                }`}
              >
                {effect.label}
              </span>
            )
          })
        ) : (
          <span className="text-[9px] text-[#A09B8C]/50">効果なし</span>
        )}
      </div>
    </div>
  )
}

function SkillCompareRow({
  base,
  candidate,
  skillKey,
  matchedCategories,
}: {
  base: ChampionProfile
  candidate: ChampionProfile
  skillKey: SkillKey
  matchedCategories: EffectCategory[]
}) {
  const baseSkill = base.skills.find((skill) => skill.key === skillKey)
  const candidateSkill = candidate.skills.find((skill) => skill.key === skillKey)
  const keyMatched = matchedCategories.length > 0

  return (
    <div
      className={`grid grid-cols-[22px_1fr_1fr] gap-2 rounded-lg border px-2 py-2 ${
        keyMatched
          ? 'border-[#C89B3C]/40 bg-[#C89B3C]/[0.06]'
          : 'border-[#785A28]/20 bg-[#010A13]/40'
      }`}
    >
      <span
        className={`grid h-5 w-5 place-items-center self-start rounded border text-[10px] font-bold ${SKILL_KEY_STYLES[skillKey]}`}
      >
        {skillKey}
      </span>
      <SkillMiniView skill={baseSkill} matchedCategories={matchedCategories} />
      <SkillMiniView
        skill={candidateSkill}
        matchedCategories={matchedCategories}
      />
    </div>
  )
}

interface SimilarityCardProps {
  base: ChampionProfile
  result: SimilarityResult
  rank: number
}

export function SimilarityCard({ base, result, rank }: SimilarityCardProps) {
  const { champion, score } = result
  const laneSet = new Set<string>(champion.lanes)

  return (
    <article className="card-enter relative flex flex-col overflow-hidden rounded-xl border border-[#785A28]/35 bg-[#0F1923]/85 shadow-[0_10px_30px_rgba(0,0,0,0.25)] backdrop-blur-sm transition hover:border-[#C89B3C]/60 hover:shadow-[0_14px_40px_rgba(200,155,60,0.12)]">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#C89B3C]/60 to-transparent" />

      <div className="flex items-start gap-3 px-4 pt-4">
        <div className="relative shrink-0">
          <img
            src={champion.championIconUrl}
            alt={champion.championName}
            loading="lazy"
            onError={(event) => {
              event.currentTarget.src = '/hex.svg'
            }}
            className="h-14 w-14 rounded-full border-2 border-[#C89B3C]/50 bg-[#0A1428] object-cover shadow-[0_0_0_2px_rgba(1,10,19,0.9)]"
          />
          <span className="absolute -left-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full border border-[#C89B3C]/70 bg-[#010A13] px-1 text-[9px] font-bold tabular-nums text-[#F5D793]">
            {rank}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-bold text-[#F0E6D2]">
            {champion.championName}
          </h3>
          <p className="truncate text-[9px] uppercase tracking-wider text-[#A09B8C]">
            {champion.championKey}
          </p>
          <div className="mt-1 flex flex-wrap gap-1">
            {champion.lanes.map((lane) => (
              <span
                key={lane}
                className="rounded border border-[#C89B3C]/30 bg-[#C89B3C]/10 px-1.5 py-0.5 text-[9px] font-medium text-[#E4C784]"
              >
                {lane}
              </span>
            ))}
            {champion.roles
              .filter((role) => !laneSet.has(role))
              .map((role) => (
                <span
                  key={role}
                  className="rounded border border-[#785A28]/30 bg-[#0A1428]/50 px-1.5 py-0.5 text-[9px] text-[#A09B8C]"
                >
                  {role}
                </span>
              ))}
          </div>
        </div>

        <span
          className={`shrink-0 rounded-lg border px-2 py-1 text-[11px] font-bold tabular-nums leading-none ${scoreTone(score)}`}
        >
          🔥 類似度 {score}%
        </span>
      </div>

      <div className="px-4 pt-3">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#010A13]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#785A28] via-[#C89B3C] to-[#F5D793] transition-[width] duration-500"
            style={{ width: `${score}%` }}
          />
        </div>
        <div className="mt-1 flex flex-wrap gap-x-2.5 gap-y-0.5 text-[8px] tabular-nums text-[#A09B8C]/65">
          <span>共通効果 +{result.weightedMatch.toFixed(1)}</span>
          <span>キー配置 +{result.keyBonus.toFixed(1)}</span>
          <span>発動形式 +{result.targetTypeBonus.toFixed(1)}</span>
          <span>Jaccard {Math.round(result.jaccard * 100)}%</span>
        </div>
      </div>

      <div className="px-4 pt-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[9px] font-semibold uppercase tracking-wider text-[#A09B8C]">
            一致:
          </span>
          {result.matchedEffects.length > 0 ? (
            result.matchedEffects.map((effect) => {
              const meta = EFFECT_CATEGORY_META[effect.category]
              return (
                <span
                  key={effect.id}
                  title={`重要度 ${formatWeight(effect.weight)}`}
                  className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[9px] font-medium leading-none ${meta.badge}`}
                >
                  <span className={`h-1 w-1 rounded-full ${meta.dot}`} />
                  {effect.label}
                  <span className="opacity-60">{formatWeight(effect.weight)}</span>
                </span>
              )
            })
          ) : (
            <span className="text-[10px] text-[#A09B8C]/60">
              共通する効果タグなし
            </span>
          )}
        </div>
      </div>

      <div className="mx-4 mt-3 rounded-lg border border-[#785A28]/25 bg-[#0A1428]/55 px-3 py-2.5">
        <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#C89B3C]">
          操作感の共通点
        </p>
        <ul className="mt-1.5 space-y-1">
          {result.operationNotes.map((note) => (
            <li
              key={note}
              className="flex items-start gap-1.5 text-[10px] leading-relaxed text-[#C7C1B4]"
            >
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#C89B3C]" />
              {note}
            </li>
          ))}
        </ul>
      </div>

      <details className="group mt-3 border-t border-[#785A28]/20">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-2.5 text-[10px] font-semibold text-[#A09B8C] transition hover:text-[#F0E6D2] [&::-webkit-details-marker]:hidden">
          <span className="flex items-center gap-1.5">
            <span className="h-1 w-1 rounded-full bg-[#C89B3C]" />
            スキル比較ミニビュー
          </span>
          <span className="flex items-center gap-1 text-[9px] text-[#C89B3C]/80">
            Q / W / E / R
            <ChevronDownIcon className="h-3 w-3 transition group-open:rotate-180" />
          </span>
        </summary>

        <div className="space-y-1.5 px-3 pb-3">
          <div className="grid grid-cols-[22px_1fr_1fr] gap-2 px-2 text-[8px] uppercase tracking-wider text-[#A09B8C]/70">
            <span />
            <span className="truncate">基準: {base.championName}</span>
            <span className="truncate">推薦: {champion.championName}</span>
          </div>

          {COMPARE_KEYS.map((skillKey) => {
            const keyMatch = result.keyMatches.find(
              (match) => match.key === skillKey,
            )

            return (
              <SkillCompareRow
                key={skillKey}
                base={base}
                candidate={champion}
                skillKey={skillKey}
                matchedCategories={keyMatch?.categories ?? []}
              />
            )
          })}
        </div>
      </details>
    </article>
  )
}
