import { useEffect, useMemo, useRef, useState } from 'react'
import {
  CHAMPIONS,
  CHAMPION_BY_KEY,
  DEFAULT_CHAMPION_KEY,
  LANES,
} from '../data/champions'
import type { Lane } from '../types/champion'
import type { EffectDetail } from '../types/skill'
import { rankSimilarChampions } from '../utils/championSimilarity'
import { SimilarityCard } from '../features/championSimilarity/SimilarityCard'
import { EFFECT_CATEGORY_META } from '../features/skillSearch/meta'
import {
  ChevronDownIcon,
  SearchIcon,
  SparkIcon,
  XIcon,
} from './Icons'

const LANE_FILTERS: Array<Lane | 'ALL'> = ['ALL', ...LANES]

function laneFilterLabel(lane: Lane | 'ALL'): string {
  return lane === 'ALL' ? '全レーン' : lane
}

export function ChampionSimilarityTab() {
  const [selectedKey, setSelectedKey] = useState(DEFAULT_CHAMPION_KEY)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [laneFilter, setLaneFilter] = useState<Lane | 'ALL'>('ALL')

  const pickerRef = useRef<HTMLDivElement | null>(null)
  const searchInputRef = useRef<HTMLInputElement | null>(null)

  const selected = CHAMPION_BY_KEY.get(selectedKey) ?? CHAMPIONS[0]

  const pickerChampions = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return CHAMPIONS

    return CHAMPIONS.filter((champion) =>
      [
        champion.championName,
        champion.championKey,
        ...champion.lanes,
        ...champion.roles,
      ]
        .join(' ')
        .toLowerCase()
        .includes(normalized),
    )
  }, [query])

  const selectedEffects = useMemo(() => {
    const collected = new Map<string, EffectDetail>()

    for (const skill of selected.skills) {
      for (const effect of skill.effects) {
        if (!collected.has(effect.id)) collected.set(effect.id, effect)
      }
    }

    return Array.from(collected.values())
  }, [selected])

  const laneCounts = useMemo(() => {
    const counts: Record<Lane, number> = {
      Top: 0,
      Jungle: 0,
      Mid: 0,
      ADC: 0,
      Support: 0,
    }

    for (const champion of CHAMPIONS) {
      if (champion.championKey === selected.championKey) continue
      for (const lane of champion.lanes) counts[lane] += 1
    }

    return counts
  }, [selected])

  const results = useMemo(() => {
    const candidates = CHAMPIONS.filter(
      (champion) =>
        champion.championKey !== selected.championKey &&
        (laneFilter === 'ALL' || champion.lanes.includes(laneFilter)),
    )

    return rankSimilarChampions(selected, candidates, 5).filter(
      (result) => result.score > 0,
    )
  }, [selected, laneFilter])

  const totalCandidates = CHAMPIONS.length - 1

  // ポップオーバー外クリック / Escape で閉じる。
  useEffect(() => {
    if (!pickerOpen) return

    const handlePointerDown = (event: MouseEvent) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node)
      ) {
        setPickerOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPickerOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [pickerOpen])

  // 展開直後は検索インプットにフォーカスする。
  useEffect(() => {
    if (!pickerOpen) return
    searchInputRef.current?.focus()
  }, [pickerOpen])

  const openPicker = () => {
    setQuery('')
    setPickerOpen((current) => !current)
  }

  const selectChampion = (key: string) => {
    setSelectedKey(key)
    setPickerOpen(false)
    setQuery('')
  }

  return (
    <div className="space-y-5">
      <section
        className={`rounded-xl border border-[#785A28]/30 bg-[#091428]/75 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.25)] backdrop-blur sm:p-5 ${
          pickerOpen ? 'relative z-40' : ''
        }`}
      >
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <SparkIcon className="h-3.5 w-3.5 text-[#C89B3C]" />
              <h2 className="font-display text-sm font-bold tracking-wide text-[#F0E6D2]">
                基準チャンピオン
              </h2>
            </div>
            <p className="mt-1 text-[10px] leading-relaxed text-[#A09B8C]">
              普段使っているチャンピオンを1体選ぶと、スキル構成が近いチャンピオンを提案します。
            </p>
          </div>
          <span className="rounded-full border border-[#785A28]/40 bg-[#0A1428]/60 px-2.5 py-1 text-[9px] tabular-nums text-[#A09B8C]">
            {CHAMPIONS.length} チャンピオン
          </span>
        </div>

        <div
          ref={pickerRef}
          className={`relative mt-4 ${pickerOpen ? 'z-[60]' : ''}`}
        >
          <div className="flex min-h-[56px] items-center gap-3 rounded-xl border border-[#C89B3C]/30 bg-[#0A1428]/70 px-3 py-2 sm:min-h-[60px]">
            <img
              src={selected.championIconUrl}
              alt={selected.championName}
              className="h-10 w-10 shrink-0 rounded-full border-2 border-[#C89B3C]/60 bg-[#0A1428] object-cover shadow-[0_0_0_2px_rgba(1,10,19,0.9)]"
              onError={(event) => {
                event.currentTarget.src = '/hex.svg'
              }}
            />

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <h3 className="truncate text-sm font-bold text-[#F0E6D2]">
                  {selected.championName}
                </h3>
                <span className="hidden text-[9px] uppercase tracking-[0.16em] text-[#A09B8C] sm:inline">
                  {selected.championKey}
                </span>
                {selected.lanes.map((lane) => (
                  <span
                    key={lane}
                    className="rounded border border-[#C89B3C]/40 bg-[#C89B3C]/12 px-1.5 py-0.5 text-[9px] font-semibold leading-none text-[#F5D793]"
                  >
                    {lane}
                  </span>
                ))}
              </div>

              <div className="mt-1 flex min-w-0 items-center gap-1 overflow-hidden">
                <span className="shrink-0 text-[9px] text-[#A09B8C]/80">
                  タグ {selectedEffects.length}
                </span>
                <span className="hidden min-w-0 flex-nowrap items-center gap-1 overflow-hidden sm:flex">
                  {selectedEffects.slice(0, 5).map((effect) => {
                    const meta = EFFECT_CATEGORY_META[effect.category]

                    return (
                      <span
                        key={effect.id}
                        title={effect.valueText ?? undefined}
                        className={`truncate rounded border px-1 py-0.5 text-[8px] font-medium leading-none ${meta.badge}`}
                      >
                        {effect.label}
                      </span>
                    )
                  })}
                  {selectedEffects.length > 5 && (
                    <span className="shrink-0 text-[8px] text-[#A09B8C]">
                      +{selectedEffects.length - 5}
                    </span>
                  )}
                </span>
              </div>
            </div>

            <button
              type="button"
              aria-expanded={pickerOpen}
              aria-haspopup="listbox"
              onClick={openPicker}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[#C89B3C]/50 bg-[#C89B3C]/12 px-2.5 py-2 text-[10px] font-semibold text-[#F5D793] transition hover:border-[#C89B3C]/80 hover:bg-[#C89B3C]/20 sm:px-3"
            >
              チャンピオンを変更
              <ChevronDownIcon
                className={`h-3 w-3 transition-transform ${
                  pickerOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
          </div>

          {pickerOpen && (
            <div className="absolute left-0 right-0 z-[100] mt-2 overflow-hidden rounded-xl border border-[#C89B3C] bg-[#091428] shadow-2xl sm:left-auto sm:w-[430px]">
              <div className="border-b border-[#785A28]/30 p-2.5">
                <div className="relative">
                  <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#C89B3C]/80" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="チャンピオン名・レーンで検索..."
                    aria-label="基準チャンピオンを検索"
                    className="w-full rounded-lg border border-[#785A28]/50 bg-[#010A13]/80 py-2.5 pl-9 pr-9 text-xs text-[#F0E6D2] placeholder:text-[#A09B8C]/50 focus:border-[#C89B3C]/80 focus:outline-none focus:ring-1 focus:ring-[#C89B3C]/30"
                  />
                  {query && (
                    <button
                      type="button"
                      onClick={() => setQuery('')}
                      aria-label="検索語をクリア"
                      className="absolute right-2 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded text-[#A09B8C] transition hover:bg-[#C89B3C]/10 hover:text-[#F0E6D2]"
                    >
                      <XIcon className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {pickerChampions.length > 0 ? (
                <ul
                  role="listbox"
                  aria-label="チャンピオン一覧"
                  className="rift-scroll max-h-72 overflow-y-auto p-1.5"
                >
                  {pickerChampions.map((champion) => {
                    const active =
                      champion.championKey === selected.championKey

                    return (
                      <li key={champion.championKey}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={active}
                          onClick={() =>
                            selectChampion(champion.championKey)
                          }
                          className={`flex w-full items-center gap-2.5 rounded-lg border px-2 py-1.5 text-left transition ${
                            active
                              ? 'border-[#C89B3C]/70 bg-[#C89B3C]/15'
                              : 'border-transparent hover:border-[#C89B3C]/35 hover:bg-[#C89B3C]/[0.06]'
                          }`}
                        >
                          <img
                            src={champion.championIconUrl}
                            alt=""
                            loading="lazy"
                            onError={(event) => {
                              event.currentTarget.src = '/hex.svg'
                            }}
                            className="h-8 w-8 shrink-0 rounded-full border border-[#785A28]/60 bg-[#0A1428] object-cover"
                          />
                          <span className="min-w-0 flex-1">
                            <span
                              className={`block truncate text-[11px] font-semibold ${
                                active
                                  ? 'text-[#F5D793]'
                                  : 'text-[#F0E6D2]'
                              }`}
                            >
                              {champion.championName}
                            </span>
                            <span className="mt-0.5 block truncate text-[9px] text-[#A09B8C]">
                              {champion.lanes.join(' / ')}
                            </span>
                          </span>
                          {active && (
                            <span className="shrink-0 text-[10px] font-bold text-[#C89B3C]">
                              ✓
                            </span>
                          )}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              ) : (
                <p className="px-3 py-6 text-center text-[11px] text-[#A09B8C]">
                  該当するチャンピオンが見つかりません
                </p>
              )}

              <div className="flex items-center justify-between border-t border-[#785A28]/25 px-3 py-2">
                <span className="text-[9px] tabular-nums text-[#A09B8C]">
                  {pickerChampions.length} / {CHAMPIONS.length} 体
                </span>
                <button
                  type="button"
                  onClick={() => setPickerOpen(false)}
                  className="text-[10px] font-semibold text-[#C89B3C] underline decoration-[#C89B3C]/40 underline-offset-4 transition hover:text-[#F0E6D2]"
                >
                  閉じる
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-[#785A28]/30 bg-[#091428]/75 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.25)] backdrop-blur sm:p-5">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <SparkIcon className="h-3.5 w-3.5 text-[#C89B3C]" />
              <h2 className="font-display text-sm font-bold tracking-wide text-[#F0E6D2]">
                他レーン絞り込み
              </h2>
            </div>
            <p className="mt-1 text-[10px] leading-relaxed text-[#A09B8C]">
              いつもと違うレーンから候補を探せます。候補 {totalCandidates} 体。
            </p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {LANE_FILTERS.map((lane) => {
            const active = laneFilter === lane
            const count =
              lane === 'ALL' ? totalCandidates : laneCounts[lane]

            return (
              <button
                key={lane}
                type="button"
                aria-pressed={active}
                onClick={() => setLaneFilter(lane)}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[11px] font-semibold transition ${
                  active
                    ? 'border-[#C89B3C]/70 bg-[#C89B3C]/20 text-[#F5D793]'
                    : 'border-[#3A3A3A]/80 bg-[#010A13]/60 text-[#A09B8C] hover:border-[#C89B3C]/50 hover:text-[#F0E6D2]'
                }`}
              >
                {laneFilterLabel(lane)}
                <span className="text-[9px] font-normal tabular-nums opacity-60">
                  {count}
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
                類似チャンピオン
              </h2>
              <span className="text-2xl font-bold tabular-nums text-[#C89B3C]">
                TOP {results.length}
              </span>
              <span className="text-[10px] text-[#A09B8C]">
                / {laneFilterLabel(laneFilter)}
              </span>
            </div>
            <p className="mt-1 text-[10px] leading-relaxed text-[#A09B8C]">
              {selected.championName} と効果タグ・キー配置・発動タイプが近い順。カードを開くとQ/W/E/Rの対応スキルを比較できます。
            </p>
          </div>

          <span className="shrink-0 rounded-full border border-[#785A28]/40 bg-[#0A1428]/60 px-2.5 py-1 text-[9px] text-[#A09B8C]">
            効果重み + キー配置 + Jaccard補正
          </span>
        </div>

        {results.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {results.map((result, index) => (
              <SimilarityCard
                key={result.champion.championKey}
                base={selected}
                result={result}
                rank={index + 1}
              />
            ))}
          </div>
        ) : (
          <div className="flex min-h-[240px] flex-col items-center justify-center rounded-xl border border-dashed border-[#785A28]/40 bg-[#091428]/40 px-6 text-center">
            <div className="grid h-14 w-14 place-items-center rounded-full border border-[#785A28]/50 bg-[#0A1428] text-[#C89B3C]">
              <SearchIcon className="h-6 w-6" />
            </div>
            <h3 className="mt-3 text-sm font-bold text-[#F0E6D2]">
              このレーンに推薦候補がありません
            </h3>
            <p className="mt-1 max-w-sm text-[11px] leading-relaxed text-[#A09B8C]">
              別のレーンを選択するか、「全レーン」に戻してみてください。
            </p>
            <button
              type="button"
              onClick={() => setLaneFilter('ALL')}
              className="mt-4 rounded-lg border border-[#C89B3C]/60 bg-[#C89B3C]/15 px-4 py-2 text-xs font-semibold text-[#F5D793] transition hover:border-[#C89B3C] hover:bg-[#C89B3C]/25"
            >
              全レーンに戻す
            </button>
          </div>
        )}
      </section>
    </div>
  )
}
