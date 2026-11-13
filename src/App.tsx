import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CcChainCalculatorTab } from './components/CcChainCalculatorTab'
import { ChampionSimilarityTab } from './components/ChampionSimilarityTab'
import { EffectRankingTab } from './components/EffectRankingTab'
import { PatchNotesDrawer } from './components/PatchNotesDrawer'
import {
  FilterIcon,
  ResetIcon,
  SearchIcon,
  SparkIcon,
  XIcon,
} from './components/Icons'
import { CHAMPION_COUNT, DATA_META, SKILL_COUNT } from './data/champions'
import { FilterPanel } from './features/skillSearch/FilterPanel'
import { Header, type MainTab } from './features/skillSearch/Header'
import { SkillCard } from './features/skillSearch/SkillCard'
import {
  DAMAGE_TYPE_META,
  EFFECT_CATEGORY_META,
  NO_DAMAGE_META,
  TARGET_TYPE_META,
} from './features/skillSearch/meta'
import { useSkillFilters } from './features/skillSearch/useSkillFilters'
import { COMPOSITION_META } from './utils/compositionClassifier'

/** 初期表示件数。スクロールまたは「もっと見る」で追加読み込みする。 */
const PAGE_SIZE = 30

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex min-h-[380px] flex-col items-center justify-center rounded-xl border border-dashed border-[#785A28]/40 bg-[#091428]/40 px-6 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-full border border-[#785A28]/50 bg-[#0A1428] text-[#C89B3C]">
        <SearchIcon className="h-7 w-7" />
      </div>
      <h3 className="mt-4 text-base font-bold text-[#F0E6D2]">
        条件に一致するスキルが見つかりませんでした
      </h3>
      <p className="mt-1 max-w-sm text-xs leading-relaxed text-[#A09B8C]">
        効果種別や解除条件を減らすか、検索語を変更してみてください。
      </p>
      <button
        type="button"
        onClick={onReset}
        className="mt-5 rounded-lg border border-[#C89B3C]/60 bg-[#C89B3C]/15 px-4 py-2 text-xs font-semibold text-[#F5D793] transition hover:border-[#C89B3C] hover:bg-[#C89B3C]/25"
      >
        フィルターをリセット
      </button>
    </div>
  )
}

export default function App() {
  const {
    filters,
    filtered,
    categoryCounts,
    hasConditions,
    activeFilterCount,
    setSearch,
    toggleCategory,
    setCategoryMatchMode,
    setSkillKey,
    setTargetType,
    toggleLane,
    setLanes,
    toggleComposition,
    setCompositions,
    toggleDamageFilter,
    setDamageFilters,
    setCleanseImmuneOnly,
    setQssRequiredOnly,
    resetFilters,
  } = useSkillFilters()

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [patchNotesOpen, setPatchNotesOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<MainTab>('search')

  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)

  const visibleSkills = useMemo(
    () => filtered.slice(0, visibleCount),
    [filtered, visibleCount],
  )
  const hasMore = visibleCount < filtered.length

  const loadMore = useCallback(() => {
    setVisibleCount((current) => Math.min(current + PAGE_SIZE, filtered.length))
  }, [filtered.length])

  // フィルター条件が変わったら表示件数を先頭に戻す。
  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [filters])

  // 下端のセンチネルが見えたら自動で追加読み込みする。
  useEffect(() => {
    if (!hasMore) return

    const node = loadMoreRef.current
    if (!node || typeof IntersectionObserver === 'undefined') return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore()
      },
      { rootMargin: '200px' },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [hasMore, loadMore])

  const closePatchNotes = useCallback(() => setPatchNotesOpen(false), [])

  useEffect(() => {
    if (!drawerOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setDrawerOpen(false)
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [drawerOpen])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [activeTab])

  const filterPanelProps = {
    filters,
    categoryCounts,
    resultCount: filtered.length,
    hasConditions,
    onSearchChange: setSearch,
    onToggleCategory: toggleCategory,
    onCategoryMatchModeChange: setCategoryMatchMode,
    onSkillKeyChange: setSkillKey,
    onTargetTypeChange: setTargetType,
    onToggleLane: toggleLane,
    onClearLanes: () => setLanes([]),
    onToggleComposition: toggleComposition,
    onClearCompositions: () => setCompositions([]),
    onToggleDamage: toggleDamageFilter,
    onClearDamage: () => setDamageFilters([]),
    onCleanseImmuneOnlyChange: setCleanseImmuneOnly,
    onQssRequiredOnlyChange: setQssRequiredOnly,
    onReset: resetFilters,
  }

  const summaryParts = [
    ...filters.categories.map((category) => EFFECT_CATEGORY_META[category].label),
    filters.categories.length > 1
      ? filters.categoryMatchMode === 'AND'
        ? 'AND検索'
        : 'OR検索'
      : null,
    filters.skillKey !== 'ALL' ? `スキル ${filters.skillKey}` : null,
    filters.targetType !== 'ALL'
      ? TARGET_TYPE_META[filters.targetType].filterLabel
      : null,
    filters.lanes.length > 0
      ? `レーン: ${filters.lanes.join(' / ')}`
      : null,
    filters.compositions.length > 0
      ? `戦術: ${filters.compositions
          .map((composition) => COMPOSITION_META[composition].label)
          .join(' / ')}`
      : null,
    filters.damageFilters.length > 0
      ? `ダメージ: ${filters.damageFilters
          .map((damage) =>
            damage === 'none'
              ? NO_DAMAGE_META.label
              : DAMAGE_TYPE_META[damage].filterLabel,
          )
          .join(' / ')}`
      : null,
    filters.cleanseImmuneOnly ? 'クレンズ無効' : null,
    filters.qssRequiredOnly ? 'QSS必須' : null,
    filters.search.trim() ? `「${filters.search.trim()}」` : null,
  ].filter((part): part is string => part !== null)

  return (
    <div className="relative min-h-screen">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#010A13]">
        <div className="hex-grid absolute inset-0 opacity-70" />
        <div className="absolute -left-48 -top-48 h-[560px] w-[560px] rounded-full bg-[#C89B3C]/[0.07] blur-[130px]" />
        <div className="absolute right-[-10%] top-[15%] h-[640px] w-[640px] rounded-full bg-[#0B4F7A]/[0.12] blur-[150px]" />
        <div className="absolute bottom-[-10%] left-[30%] h-[420px] w-[420px] rounded-full bg-[#2A1A4A]/[0.15] blur-[120px]" />
      </div>

      <Header
        patchVersion={DATA_META.version}
        championCount={CHAMPION_COUNT}
        skillCount={SKILL_COUNT}
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab)
          setDrawerOpen(false)
        }}
        patchNotesOpen={patchNotesOpen}
        onOpenPatchNotes={() => setPatchNotesOpen(true)}
      />

      <main className="mx-auto max-w-[1700px] px-4 pb-8 pt-5 sm:px-6 lg:px-8">
        <div
          id="panel-search"
          role="tabpanel"
          aria-labelledby="tab-search"
          className={activeTab === 'search' ? '' : 'hidden'}
        >
          <div className="lg:flex lg:items-start lg:gap-6">
          <aside className="hidden w-[300px] shrink-0 lg:block">
            <div className="rift-scroll sticky top-5 max-h-[calc(100vh-2.5rem)] overflow-y-auto rounded-xl border border-[#785A28]/30 bg-[#091428]/85 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur">
              <div className="mb-4 flex items-center gap-2 border-b border-[#785A28]/25 pb-3">
                <SparkIcon className="h-3.5 w-3.5 text-[#C89B3C]" />
                <h2 className="font-display text-xs font-bold tracking-[0.18em] text-[#F0E6D2]">
                  FILTERS
                </h2>
                <span className="ml-auto text-[9px] uppercase tracking-wider text-[#A09B8C]/60">
                  条件を選択
                </span>
              </div>
              <FilterPanel {...filterPanelProps} />
            </div>
          </aside>

          <section className="min-w-0 flex-1">
            <div className="sticky top-0 z-30 -mx-4 mb-4 border-b border-[#785A28]/25 bg-[#010A13]/90 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6 lg:hidden">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#C89B3C]/80" />
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="チャンピオン名、スキル名で検索..."
                    aria-label="スキル検索"
                    className="w-full rounded-lg border border-[#785A28]/50 bg-[#091428] py-2.5 pl-9 pr-9 text-xs text-[#F0E6D2] placeholder:text-[#A09B8C]/50 focus:border-[#C89B3C]/80 focus:outline-none focus:ring-1 focus:ring-[#C89B3C]/30"
                  />
                  {filters.search && (
                    <button
                      type="button"
                      onClick={() => setSearch('')}
                      aria-label="検索語をクリア"
                      className="absolute right-2 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded text-[#A09B8C] transition hover:bg-[#C89B3C]/10 hover:text-[#F0E6D2]"
                    >
                      <XIcon className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setDrawerOpen(true)}
                  className="relative inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg border border-[#785A28]/50 bg-[#091428] px-3 text-xs font-semibold text-[#F0E6D2] transition hover:border-[#C89B3C]/60"
                >
                  <FilterIcon className="h-4 w-4 text-[#C89B3C]" />
                  フィルター
                  {activeFilterCount > 0 && (
                    <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-[#C89B3C] px-1 text-[10px] font-bold tabular-nums text-[#010A13]">
                      {activeFilterCount}
                    </span>
                  )}
                </button>
              </div>
            </div>

            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="flex flex-wrap items-baseline gap-2">
                  <h2 className="font-display text-base font-bold tracking-wide text-[#F0E6D2] sm:text-lg">
                    ヒット:
                  </h2>
                  <span className="text-3xl font-bold tabular-nums text-[#C89B3C]">
                    {filtered.length}
                  </span>
                  <span className="text-xs text-[#A09B8C]">件</span>
                  <span className="text-[10px] text-[#A09B8C]/60">
                    / 全 {SKILL_COUNT} スキル
                  </span>
                </div>
                <p className="mt-1 text-[10px] leading-relaxed text-[#A09B8C] sm:text-[11px]">
                  {summaryParts.length > 0
                    ? summaryParts.join(' / ')
                    : `Data Dragon 由来の全スキル（${CHAMPION_COUNT}チャンピオン）を表示中`}
                </p>
              </div>

              {hasConditions && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-lg border border-[#C89B3C]/40 bg-[#C89B3C]/10 px-3 py-2 text-[11px] font-semibold text-[#E4C784] transition hover:border-[#C89B3C]/70 hover:bg-[#C89B3C]/15 hover:text-[#F5D793] sm:self-auto"
                >
                  <ResetIcon className="h-3 w-3" />
                  条件をクリア
                </button>
              )}
            </div>

            {filtered.length > 0 ? (
              <>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {visibleSkills.map((skill, index) => (
                    <SkillCard key={skill.id} skill={skill} index={index} />
                  ))}
                </div>

                {hasMore && (
                  <div ref={loadMoreRef} className="mt-6 flex flex-col items-center gap-2">
                    <button
                      type="button"
                      onClick={loadMore}
                      className="inline-flex items-center gap-2 rounded-lg border border-[#C89B3C]/50 bg-[#C89B3C]/10 px-5 py-2.5 text-xs font-semibold text-[#E4C784] transition hover:border-[#C89B3C]/80 hover:bg-[#C89B3C]/20 hover:text-[#F5D793]"
                    >
                      もっと見る
                      <span className="text-[10px] font-normal text-[#A09B8C]">
                        残り {filtered.length - visibleCount} 件
                      </span>
                    </button>
                    <p className="text-[10px] text-[#A09B8C]/60">
                      {visibleCount} / {filtered.length} 件を表示中
                    </p>
                  </div>
                )}
              </>
            ) : (
              <EmptyState onReset={resetFilters} />
            )}
          </section>
          </div>
        </div>

        <div
          id="panel-similar"
          role="tabpanel"
          aria-labelledby="tab-similar"
          className={activeTab === 'similar' ? '' : 'hidden'}
        >
          <ChampionSimilarityTab />
        </div>

        <div
          id="panel-cc-chain"
          role="tabpanel"
          aria-labelledby="tab-cc-chain"
          className={activeTab === 'cc-chain' ? '' : 'hidden'}
        >
          <CcChainCalculatorTab />
        </div>

        <div
          id="panel-ranking"
          role="tabpanel"
          aria-labelledby="tab-ranking"
          className={activeTab === 'ranking' ? '' : 'hidden'}
        >
          <EffectRankingTab />
        </div>
      </main>

      <footer className="mx-auto max-w-[1700px] px-4 pb-8 pt-2 sm:px-6 lg:px-8">
        <div className="border-t border-[#785A28]/25 pt-6 text-center text-[10px] leading-relaxed text-[#A09B8C]/70">
          <p>
            Data Dragon {DATA_META.version} (ja_JP) — {CHAMPION_COUNT} チャンピオン /{' '}
            {SKILL_COUNT} スキル
          </p>
          <p className="mt-1">
            RIFT EFFECTS は Riot Games 非公式のファンメイドツールです。League of Legends
            は Riot Games, Inc. の商標です。
          </p>
        </div>
      </footer>

      {drawerOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="フィルター"
        >
          <div
            className="absolute inset-0 bg-[#010A13]/80 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-[90%] max-w-[360px] flex-col border-r border-[#C89B3C]/30 bg-[#091428] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#785A28]/30 px-4 py-3">
              <div className="flex items-center gap-2">
                <FilterIcon className="h-4 w-4 text-[#C89B3C]" />
                <h2 className="font-display text-sm font-bold tracking-wide text-[#F0E6D2]">
                  フィルター
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="フィルターを閉じる"
                className="grid h-9 w-9 place-items-center rounded-lg border border-[#785A28]/40 text-[#A09B8C] transition hover:border-[#C89B3C]/50 hover:text-[#F0E6D2]"
              >
                <XIcon className="h-4 w-4" />
              </button>
            </div>
            <div className="rift-scroll flex-1 overflow-y-auto p-4">
              <FilterPanel {...filterPanelProps} />
            </div>
          </div>
        </div>
      )}

      {patchNotesOpen && <PatchNotesDrawer onClose={closePatchNotes} />}
    </div>
  )
}
