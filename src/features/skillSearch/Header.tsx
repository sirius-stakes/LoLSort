import { ScrollIcon } from '../../components/Icons'

export type MainTab = 'search' | 'similar' | 'cc-chain' | 'ranking'

interface HeaderProps {
  patchVersion: string
  championCount: number
  skillCount: number
  activeTab: MainTab
  onTabChange: (tab: MainTab) => void
  patchNotesOpen: boolean
  onOpenPatchNotes: () => void
}

const TABS: Array<{ id: MainTab; label: string }> = [
  { id: 'search', label: 'スキル検索' },
  { id: 'similar', label: '類似チャンピオン診断' },
  { id: 'cc-chain', label: 'CCチェイン計算機' },
  { id: 'ranking', label: '効果数値ランキング' },
]

export function Header({
  patchVersion,
  championCount,
  skillCount,
  activeTab,
  onTabChange,
  patchNotesOpen,
  onOpenPatchNotes,
}: HeaderProps) {
  return (
    <header className="relative border-b border-[#785A28]/25">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#C89B3C]/70 to-transparent" />

      <div className="mx-auto max-w-[1700px] px-4 pt-5 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="relative grid h-14 w-14 shrink-0 place-items-center sm:h-16 sm:w-16">
              <div className="absolute inset-0 rounded-full bg-[#C89B3C]/15 blur-xl" />
              <img
                src="/hex.svg"
                alt=""
                className="relative h-12 w-12 drop-shadow-[0_0_10px_rgba(200,155,60,0.5)] sm:h-14 sm:w-14"
              />
            </div>

            <div>
              <div className="flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.35em] text-[#C89B3C] sm:text-[10px]">
                <span className="h-px w-6 bg-[#C89B3C]/60" />
                Skill Effect Atlas
              </div>
              <h1 className="gold-text mt-1 font-display text-3xl font-bold leading-none tracking-[0.12em] sm:text-4xl">
                RIFT EFFECTS
              </h1>
              <p className="mt-2 text-[11px] text-[#A09B8C] sm:text-xs">
                League of Legends のスキルを、バフ・デバフ効果から検索する
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[10px] sm:text-[11px]">
            <button
              type="button"
              onClick={onOpenPatchNotes}
              aria-haspopup="dialog"
              aria-expanded={patchNotesOpen}
              aria-label="最新パッチノートを開く"
              className="group inline-flex items-center gap-2 rounded-full border border-[#C89B3C]/60 bg-gradient-to-r from-[#C89B3C]/20 to-[#C89B3C]/5 px-3 py-1.5 font-semibold tracking-wide text-[#F5D793] shadow-[0_0_18px_rgba(200,155,60,0.12)] transition hover:border-[#C89B3C] hover:from-[#C89B3C]/30 hover:to-[#C89B3C]/10 hover:text-[#FFF3D0]"
            >
              <ScrollIcon className="h-3.5 w-3.5 text-[#C89B3C] transition group-hover:scale-110" />
              最新パッチ
              <span className="h-1 w-1 rounded-full bg-[#3FB68B] shadow-[0_0_6px_rgba(63,182,139,0.9)]" />
            </button>

            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#C89B3C]/45 bg-[#C89B3C]/10 px-3 py-1 font-semibold tracking-wider text-[#E4C784]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#C89B3C] shadow-[0_0_6px_rgba(200,155,60,0.8)]" />
              PATCH {patchVersion}
            </span>
            <span className="rounded-full border border-[#785A28]/40 bg-[#0A1428]/60 px-3 py-1 text-[#A09B8C]">
              <strong className="font-semibold text-[#F0E6D2]">{championCount}</strong>{' '}
              チャンピオン
            </span>
            <span className="rounded-full border border-[#785A28]/40 bg-[#0A1428]/60 px-3 py-1 text-[#A09B8C]">
              <strong className="font-semibold text-[#F0E6D2]">{skillCount}</strong> スキル
            </span>
          </div>
        </div>

        <nav
          aria-label="メインナビゲーション"
          role="tablist"
          className="rift-scroll mt-5 flex items-stretch gap-1 overflow-x-auto border-t border-[#785A28]/20 pt-1"
        >
          {TABS.map((tab) => {
            const active = tab.id === activeTab

            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                id={`tab-${tab.id}`}
                aria-selected={active}
                aria-controls={`panel-${tab.id}`}
                onClick={() => onTabChange(tab.id)}
                className={`group relative inline-flex shrink-0 items-center gap-2 border-b-2 px-3 py-2.5 text-[11px] font-semibold transition sm:px-4 sm:text-xs ${
                  active
                    ? 'border-[#C89B3C] bg-gradient-to-b from-[#C89B3C]/[0.09] to-transparent text-[#F5D793]'
                    : 'border-transparent text-[#A09B8C] hover:border-[#785A28]/60 hover:text-[#F0E6D2]'
                }`}
              >
                {tab.label}
                {active && (
                  <span className="absolute inset-x-3 -bottom-[2px] h-[2px] bg-gradient-to-r from-transparent via-[#F5D793] to-transparent" />
                )}
              </button>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
