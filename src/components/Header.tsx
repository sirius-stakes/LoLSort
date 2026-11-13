import type { DataMeta } from '../types'
import { BellIcon } from './Icons'

interface HeaderProps {
  meta: DataMeta
  onOpenPatchNotes: () => void
}

export function Header({ meta, onOpenPatchNotes }: HeaderProps) {
  return (
    <header className="relative border-b border-[#785A28]/25">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#C89B3C]/70 to-transparent" />
      <div className="mx-auto flex max-w-[1700px] flex-col gap-5 px-4 py-6 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
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
            aria-label="最新パッチノートを開く"
            className="group inline-flex items-center gap-2 rounded-full border border-[#C89B3C]/60 bg-gradient-to-r from-[#C89B3C]/20 to-[#C89B3C]/5 px-3 py-1.5 font-semibold tracking-wide text-[#F5D793] shadow-[0_0_18px_rgba(200,155,60,0.12)] transition hover:border-[#C89B3C] hover:from-[#C89B3C]/30 hover:to-[#C89B3C]/10 hover:text-[#FFF3D0]"
          >
            <BellIcon className="h-3.5 w-3.5 text-[#C89B3C] transition group-hover:animate-pulse" />
            最新パッチ
            <span className="h-1 w-1 rounded-full bg-[#3FB68B] shadow-[0_0_6px_rgba(63,182,139,0.9)]" />
          </button>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#C89B3C]/45 bg-[#C89B3C]/10 px-3 py-1 font-semibold tracking-wider text-[#E4C784]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#C89B3C] shadow-[0_0_6px_rgba(200,155,60,0.8)]" />
            PATCH {meta.version}
          </span>
          <span className="rounded-full border border-[#785A28]/40 bg-[#0A1428]/60 px-3 py-1 text-[#A09B8C]">
            {meta.locale}
          </span>
          <span className="rounded-full border border-[#785A28]/40 bg-[#0A1428]/60 px-3 py-1 text-[#A09B8C]">
            <strong className="font-semibold text-[#F0E6D2]">{meta.championCount}</strong> チャンピオン
          </span>
          <span className="rounded-full border border-[#785A28]/40 bg-[#0A1428]/60 px-3 py-1 text-[#A09B8C]">
            <strong className="font-semibold text-[#F0E6D2]">{meta.skillCount}</strong> スキル
          </span>
        </div>
      </div>
    </header>
  )
}
