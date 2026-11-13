import type { SkillItem } from '../../types/skill'
import { ClockIcon } from '../../components/Icons'
import { CHAMPION_BY_KEY } from '../../data/champions'
import { highlightSkillDescription } from '../../lib/highlight'
import {
  COMPOSITION_META,
  classifyChampionComposition,
} from '../../utils/compositionClassifier'
import { DamageBadge, EffectBadge } from './EffectBadge'
import { formatSeconds, maxEffectDuration } from './format'
import { SKILL_KEY_STYLES, TARGET_TYPE_META } from './meta'

interface SkillCardProps {
  skill: SkillItem
  index: number
}

export function SkillCard({ skill, index }: SkillCardProps) {
  const target = TARGET_TYPE_META[skill.targetType]
  const duration = maxEffectDuration(
    skill.effects.map((effect) => effect.duration),
  )

  const champion = CHAMPION_BY_KEY.get(skill.championKey)
  const lanes =
    champion && champion.lanes.length > 0
      ? champion.lanes
      : skill.championRole.slice(0, 2)
  const compositions = champion ? classifyChampionComposition(champion) : []

  return (
    <article
      className="card-enter group relative flex flex-col overflow-hidden rounded-xl border border-[#785A28]/35 bg-[#0F1923]/85 shadow-[0_10px_30px_rgba(0,0,0,0.25)] backdrop-blur-sm transition duration-200 hover:-translate-y-0.5 hover:border-[#C89B3C]/60 hover:shadow-[0_14px_40px_rgba(200,155,60,0.12)]"
      style={{ animationDelay: `${Math.min(index, 12) * 24}ms` }}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#C89B3C]/60 to-transparent opacity-60 transition group-hover:opacity-100" />

      <header className="flex items-start gap-3 px-4 pt-4">
        <img
          src={skill.championIconUrl}
          alt={skill.championName}
          loading="lazy"
          onError={(event) => {
            event.currentTarget.src = '/hex.svg'
          }}
          className="h-11 w-11 shrink-0 rounded-full border-2 border-[#C89B3C]/50 bg-[#0A1428] object-cover shadow-[0_0_0_2px_rgba(1,10,19,0.9)]"
        />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-bold tracking-wide text-[#F0E6D2]">
            {skill.championName}
          </h3>
          <p className="truncate text-[10px] uppercase tracking-wider text-[#A09B8C]">
            {skill.championKey}
          </p>
        </div>

        <div className="ml-auto flex max-w-[58%] flex-wrap items-center justify-end gap-1.5">
          {lanes.map((lane) => (
            <span
              key={`lane-${lane}`}
              className="rounded border border-[#C89B3C]/70 bg-[#C89B3C]/12 px-1.5 py-0.5 text-[9px] font-semibold leading-none text-[#F0E6D2]"
            >
              {lane}
            </span>
          ))}
          {compositions.map((type) => {
            const meta = COMPOSITION_META[type]

            return (
              <span
                key={`composition-${type}`}
                title={meta.description}
                className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[9px] font-medium leading-none ${meta.badge}`}
              >
                <span className={`h-1 w-1 shrink-0 rounded-full ${meta.dot}`} />
                {meta.label}
              </span>
            )
          })}
        </div>
      </header>

      <div className="flex gap-3 px-4 pt-3">
        <div className="relative shrink-0">
          <img
            src={skill.iconUrl}
            alt=""
            loading="lazy"
            onError={(event) => {
              event.currentTarget.src = '/hex.svg'
            }}
            className="h-14 w-14 rounded-lg border border-[#785A28]/60 bg-[#0A1428] object-cover"
          />
          <span
            className={`absolute -bottom-1 -right-1 grid h-5 min-w-5 place-items-center rounded border px-1 text-[10px] font-bold ${SKILL_KEY_STYLES[skill.key]}`}
          >
            {skill.key}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <h4 className="truncate pt-0.5 text-sm font-semibold text-[#F0E6D2]">
            {skill.name}
          </h4>

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {skill.damageTypes.map((type) => (
              <DamageBadge key={`damage-${type}`} type={type} />
            ))}
            <span
              className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-semibold leading-none ${target.badge}`}
            >
              {target.label}
            </span>
            {duration !== null && (
              <span className="inline-flex items-center gap-1 rounded border border-[#C89B3C]/55 bg-[#C89B3C]/10 px-1.5 py-0.5 text-[10px] font-bold leading-none text-[#F5D793]">
                <ClockIcon className="h-3 w-3" />
                {formatSeconds(duration)}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 pt-3">
        <p className="text-[12px] leading-relaxed text-[#C7C1B4]">
          {highlightSkillDescription(skill.description, skill.effects)}
        </p>
      </div>

      <footer className="mt-auto flex flex-wrap items-center gap-1.5 border-t border-[#785A28]/20 px-4 pb-3 pt-3">
        {skill.effects.length > 0 ? (
          skill.effects.map((effect, effectIndex) => (
            <EffectBadge key={`${effect.id}-${effectIndex}`} effect={effect} />
          ))
        ) : (
          <span className="text-[10px] text-[#A09B8C]/60">効果タグなし</span>
        )}
      </footer>
    </article>
  )
}
