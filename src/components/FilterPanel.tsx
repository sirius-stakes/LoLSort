import type { TagMode, SkillKeyFilter } from '../types'
import {
  CATEGORY_STYLES,
  SKILL_KEYS,
  TAG_GROUPS,
  TAGS,
  type TagId,
} from '../data/tags'
import { ResetIcon, SearchIcon, XIcon } from './Icons'

interface FilterPanelProps {
  search: string
  onSearchChange: (value: string) => void
  selectedTags: TagId[]
  onToggleTag: (tag: TagId) => void
  tagMode: TagMode
  onTagModeChange: (mode: TagMode) => void
  skillKey: SkillKeyFilter
  onSkillKeyChange: (key: SkillKeyFilter) => void
  tagCounts: Partial<Record<TagId, number>>
  resultCount: number
  onResetAll: () => void
  hasConditions: boolean
}

function SectionTitle({ children, hint }: { children: string; hint?: string }) {
  return (
    <div className="mb-2 flex items-center justify-between">
      <h3 className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#C89B3C]">{children}</h3>
      {hint && <span className="text-[9px] text-[#A09B8C]/60">{hint}</span>}
    </div>
  )
}

export function FilterPanel({
  search,
  onSearchChange,
  selectedTags,
  onToggleTag,
  tagMode,
  onTagModeChange,
  skillKey,
  onSkillKeyChange,
  tagCounts,
  resultCount,
  onResetAll,
  hasConditions,
}: FilterPanelProps) {
  return (
    <div className="space-y-5">
      <div>
        <SectionTitle hint="リアルタイム">検索</SectionTitle>
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#C89B3C]/80" />
          <input
            type="text"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="チャンピオン名、スキル名で検索..."
            className="w-full rounded-lg border border-[#785A28]/50 bg-[#010A13]/80 py-2.5 pl-9 pr-9 text-xs text-[#F0E6D2] placeholder:text-[#A09B8C]/50 focus:border-[#C89B3C]/80 focus:outline-none focus:ring-1 focus:ring-[#C89B3C]/30"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label="検索語をクリア"
              className="absolute right-2 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded text-[#A09B8C] transition hover:bg-[#C89B3C]/10 hover:text-[#F0E6D2]"
            >
              <XIcon className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      <div>
        <SectionTitle hint="複数選択可">効果タグ</SectionTitle>

        <div className="mb-4">
          <div className="grid grid-cols-2 gap-1 rounded-lg border border-[#785A28]/40 bg-[#010A13]/70 p-1">
            {(['AND', 'OR'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                aria-pressed={tagMode === mode}
                onClick={() => onTagModeChange(mode)}
                className={`rounded-md px-2 py-1.5 text-[11px] font-bold transition ${
                  tagMode === mode
                    ? 'bg-[#C89B3C]/20 text-[#F5D793] shadow-[inset_0_0_0_1px_rgba(200,155,60,0.5)]'
                    : 'text-[#A09B8C] hover:text-[#F0E6D2]'
                }`}
              >
                {mode}
                <span className="ml-1 text-[9px] font-normal opacity-70">
                  {mode === 'AND' ? 'すべて' : 'いずれか'}
                </span>
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-[9px] leading-relaxed text-[#A09B8C]/70">
            {tagMode === 'AND'
              ? '選択したタグをすべて持つスキルに絞り込みます。'
              : '選択したタグのいずれかを持つスキルに絞り込みます。'}
          </p>
        </div>

        <div className="space-y-4">
          {TAG_GROUPS.map((group) => {
            const style = CATEGORY_STYLES[group.id]
            const activeCount = group.tags.filter((tag) => selectedTags.includes(tag)).length

            return (
              <section key={group.id}>
                <div className="mb-1.5 flex items-center gap-2">
                  <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
                  <h4 className={`text-[10px] font-semibold tracking-wide ${style.heading}`}>
                    {group.label}
                  </h4>
                  {activeCount > 0 && (
                    <span className="ml-auto rounded-full bg-[#C89B3C]/15 px-1.5 py-0.5 text-[9px] font-bold tabular-nums text-[#E4C784]">
                      {activeCount}
                    </span>
                  )}
                </div>
                <p className="mb-2 text-[9px] leading-none text-[#A09B8C]/55">{group.caption}</p>

                <div className="flex flex-wrap gap-1.5">
                  {group.tags.map((tag) => {
                    const definition = TAGS[tag]
                    const active = selectedTags.includes(tag)
                    const count = tagCounts[tag] ?? 0

                    return (
                      <button
                        key={tag}
                        type="button"
                        aria-pressed={active}
                        onClick={() => onToggleTag(tag)}
                        title={`${definition.label} — ${count} スキル`}
                        className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1.5 text-[11px] font-medium transition ${
                          active
                            ? style.active
                            : 'border-[#3A3A3A]/80 bg-[#010A13]/60 text-[#A09B8C] hover:border-[#C89B3C]/50 hover:text-[#F0E6D2]'
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${active ? style.dot : 'bg-[#5A5A5A]'}`}
                        />
                        {definition.label}
                        <span className="text-[9px] tabular-nums opacity-55">{count}</span>
                      </button>
                    )
                  })}
                </div>
              </section>
            )
          })}
        </div>
      </div>

      <div>
        <SectionTitle hint="スキル枠">スキルキー</SectionTitle>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            aria-pressed={skillKey === 'ALL'}
            onClick={() => onSkillKeyChange('ALL')}
            className={`rounded-md border px-2.5 py-1.5 text-[11px] font-semibold transition ${
              skillKey === 'ALL'
                ? 'border-[#C89B3C]/70 bg-[#C89B3C]/20 text-[#F5D793]'
                : 'border-[#3A3A3A]/80 bg-[#010A13]/60 text-[#A09B8C] hover:border-[#C89B3C]/50 hover:text-[#F0E6D2]'
            }`}
          >
            All
          </button>
          {SKILL_KEYS.map((key) => (
            <button
              key={key}
              type="button"
              aria-pressed={skillKey === key}
              onClick={() => onSkillKeyChange(key)}
              className={`rounded-md border px-2.5 py-1.5 text-[11px] font-semibold transition ${
                skillKey === key
                  ? 'border-[#C89B3C]/70 bg-[#C89B3C]/20 text-[#F5D793]'
                  : 'border-[#3A3A3A]/80 bg-[#010A13]/60 text-[#A09B8C] hover:border-[#C89B3C]/50 hover:text-[#F0E6D2]'
              }`}
            >
              {key === 'P' ? 'Passive' : key}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3 border-t border-[#785A28]/25 pt-4">
        <div className="flex items-center justify-between gap-2 rounded-lg border border-[#785A28]/40 bg-[#010A13]/60 px-3 py-2.5">
          <div className="flex items-center gap-2">
            <span
              className={`grid h-6 min-w-6 place-items-center rounded-full px-1 text-[11px] font-bold tabular-nums ${
                selectedTags.length > 0
                  ? 'bg-[#C89B3C] text-[#010A13]'
                  : 'bg-[#785A28]/25 text-[#A09B8C]'
              }`}
            >
              {selectedTags.length}
            </span>
            <span className="text-[10px] text-[#A09B8C]">タグ選択中</span>
          </div>
          <button
            type="button"
            onClick={onResetAll}
            disabled={!hasConditions}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#C89B3C] underline decoration-[#C89B3C]/40 underline-offset-4 transition hover:text-[#F0E6D2] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ResetIcon className="h-3 w-3" />
            条件をクリア
          </button>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[10px] text-[#A09B8C]">該当スキル</span>
          <span className="text-sm font-bold tabular-nums text-[#F5D793]">
            {resultCount.toLocaleString('ja-JP')}
            <span className="ml-1 text-[10px] font-normal text-[#A09B8C]">件</span>
          </span>
        </div>
      </div>
    </div>
  )
}
