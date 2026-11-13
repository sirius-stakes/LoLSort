import { useState } from 'react'
import type { SkillEntry } from '../types'
import { SKILL_KEY_STYLES } from '../data/tags'
import { assetUrl, formatCooldown, formatDuration } from '../lib/format'
import { highlightDescription } from '../lib/highlight'
import { ClockIcon } from './Icons'
import { TagBadge } from './TagBadge'

interface SkillCardProps {
  entry: SkillEntry
  index: number
}

function DurationBadge({ duration }: { duration: SkillEntry['skill']['duration'] }) {
  if (!duration) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-[#3A3A3A]/80 bg-[#0A1428]/60 px-2 py-1 text-[10px] text-[#A09B8C]">
        <ClockIcon className="h-3 w-3" />
        —
        <span className="text-[9px] opacity-60">時間効果なし</span>
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-[#C89B3C]/60 bg-gradient-to-r from-[#C89B3C]/20 to-[#C89B3C]/5 px-2 py-1 shadow-[0_0_10px_rgba(200,155,60,0.10)]">
      <ClockIcon className="h-3.5 w-3.5 shrink-0 text-[#E4C784]" />
      <span className="text-sm font-bold tabular-nums leading-none text-[#F5D793]">
        {formatDuration(duration)}
      </span>
      <span className="text-[9px] font-medium uppercase tracking-wider text-[#C89B3C]/80">
        {duration.label}
      </span>
    </span>
  )
}

export function SkillCard({ entry, index }: SkillCardProps) {
  const { champion, skill } = entry
  const [expanded, setExpanded] = useState(false)
  const isLong = skill.description.length > 120
  const lane = champion.lanes[0]
  const extraLanes = champion.lanes.length - 1
  const cooldown = formatCooldown(skill.cooldown)

  return (
    <article
      className="card-enter group relative flex flex-col overflow-hidden rounded-xl border border-[#785A28]/35 bg-[#0F1923]/85 shadow-[0_10px_30px_rgba(0,0,0,0.25)] backdrop-blur-sm transition duration-200 hover:-translate-y-0.5 hover:border-[#C89B3C]/60 hover:shadow-[0_14px_40px_rgba(200,155,60,0.12)]"
      style={{ animationDelay: `${Math.min(index, 12) * 22}ms` }}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#C89B3C]/60 to-transparent opacity-60 transition group-hover:opacity-100" />

      <header className="flex items-center gap-3 px-4 pt-4">
        <img
          src={assetUrl(champion.icon)}
          alt={champion.name}
          loading="lazy"
          onError={(event) => {
            event.currentTarget.src = '/hex.svg'
          }}
          className="h-11 w-11 shrink-0 rounded-full border-2 border-[#C89B3C]/50 bg-[#0A1428] object-cover shadow-[0_0_0_2px_rgba(1,10,19,0.9)]"
        />
        <div className="min-w-0">
          <h3 className="truncate text-sm font-bold tracking-wide text-[#F0E6D2]">
            {champion.name}
          </h3>
          <p className="truncate text-[10px] text-[#A09B8C]">{champion.title}</p>
        </div>

        {lane && (
          <span
            title={champion.lanes.join(' / ')}
            className="ml-auto shrink-0 rounded border border-[#C89B3C]/30 bg-[#C89B3C]/10 px-1.5 py-0.5 text-[9px] font-medium text-[#E4C784]"
          >
            {lane}
            {extraLanes > 0 ? ` +${extraLanes}` : ''}
          </span>
        )}
      </header>

      <div className="flex gap-3 px-4 pt-3">
        <div className="relative shrink-0">
          <img
            src={assetUrl(skill.icon)}
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
          <div className="flex items-center gap-2">
            <span className="rounded bg-[#C89B3C]/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#C89B3C]">
              {skill.key === 'P' ? 'Passive' : skill.key}
            </span>
            <h4 className="truncate text-sm font-semibold text-[#F0E6D2]">{skill.name}</h4>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <DurationBadge duration={skill.duration} />
            {cooldown && (
              <span className="text-[10px] tabular-nums text-[#A09B8C]">CD {cooldown}</span>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 pt-3">
        <p
          className={`text-[12px] leading-relaxed text-[#C7C1B4] ${
            !expanded && isLong ? 'line-clamp-4' : ''
          }`}
        >
          {highlightDescription(skill.description, skill.tags)}
        </p>
        {isLong && (
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="mt-1 text-[10px] font-medium text-[#C89B3C]/90 transition hover:text-[#F0E6D2]"
          >
            {expanded ? '閉じる' : '続きを読む'}
          </button>
        )}
      </div>

      <footer className="mt-auto flex flex-wrap items-center gap-1.5 border-t border-[#785A28]/20 px-4 pb-3 pt-3">
        {skill.tags.length > 0 ? (
          skill.tags.map((tag) => <TagBadge key={tag} tag={tag} />)
        ) : (
          <span className="text-[10px] text-[#A09B8C]/60">効果タグなし</span>
        )}
      </footer>
    </article>
  )
}
