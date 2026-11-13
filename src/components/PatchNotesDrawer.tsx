import { useEffect, useRef, useState } from 'react'
import type { PatchNoteEntry, PatchNotesData } from '../types'
import {
  ChevronRightIcon,
  ExternalLinkIcon,
  ResetIcon,
  ScrollIcon,
  XIcon,
} from './Icons'
import {
  PATCH_NOTES_LIST_URL,
  formatFetchedAt,
  formatPatchDate,
  loadPatchNotes,
} from '../lib/patchNotes'

interface PatchNotesDrawerProps {
  onClose: () => void
}

type LoadState =
  | { status: 'loading' }
  | { status: 'ready'; data: PatchNotesData; warning: string | null }
  | { status: 'error'; message: string }

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function PatchNotesDrawer({ onClose }: PatchNotesDrawerProps) {
  const [state, setState] = useState<LoadState>({ status: 'loading' })
  const [reloadToken, setReloadToken] = useState(0)
  const panelRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    let cancelled = false
    setState({ status: 'loading' })

    loadPatchNotes({ force: reloadToken > 0 })
      .then((result) => {
        if (cancelled) return
        setState({
          status: 'ready',
          data: result.data,
          warning: result.warning,
        })
      })
      .catch((error: unknown) => {
        if (cancelled) return
        setState({
          status: 'error',
          message:
            error instanceof Error
              ? error.message
              : 'パッチノートの取得に失敗しました。',
        })
      })

    return () => {
      cancelled = true
    }
  }, [reloadToken])

  useEffect(() => {
    const previousActive =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const focusTimer = window.setTimeout(() => closeRef.current?.focus(), 30)

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }

      if (event.key !== 'Tab') return

      const panel = panelRef.current
      if (!panel) return

      const focusable = Array.from(
        panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter((element) => element.offsetParent !== null)

      if (focusable.length === 0) {
        event.preventDefault()
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      window.clearTimeout(focusTimer)
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
      previousActive?.focus()
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-[60]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="patch-notes-title"
    >
      <div
        className="patch-overlay-enter absolute inset-0 bg-[#010A13]/85 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={panelRef}
        className="patch-drawer-enter absolute inset-y-0 right-0 flex w-full max-w-[440px] flex-col border-l border-[#C89B3C]/40 bg-[#091428] shadow-[-24px_0_60px_rgba(0,0,0,0.55)]"
      >
        <div className="flex items-start justify-between gap-3 border-b border-[#785A28]/30 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-full border border-[#C89B3C]/50 bg-[#C89B3C]/10 text-[#C89B3C]">
              <ScrollIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.3em] text-[#C89B3C]">
                Patch Notes
              </p>
              <h2
                id="patch-notes-title"
                className="font-display text-lg font-bold tracking-wide text-[#F0E6D2]"
              >
                最新パッチノート
              </h2>
            </div>
          </div>

          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="パッチノートを閉じる"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-[#785A28]/40 text-[#A09B8C] transition hover:border-[#C89B3C]/50 hover:text-[#F0E6D2]"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="rift-scroll flex-1 overflow-y-auto px-5 pb-6 pt-5">
          {state.status === 'loading' && <LoadingSkeleton />}

          {state.status === 'error' && (
            <ErrorState
              message={state.message}
              onRetry={() => setReloadToken((value) => value + 1)}
            />
          )}

          {state.status === 'ready' && (
            <ReadyContent
              data={state.data}
              warning={state.warning}
              onRetry={() => setReloadToken((value) => value + 1)}
            />
          )}
        </div>
      </div>
    </div>
  )
}

function ReadyContent({
  data,
  warning,
  onRetry,
}: {
  data: PatchNotesData
  warning: string | null
  onRetry: () => void
}) {
  const [latest, ...previous] = data.entries

  return (
    <div className="space-y-5">
      {warning && (
        <div className="flex items-start gap-2 rounded-lg border border-[#C89B3C]/35 bg-[#C89B3C]/10 px-3 py-2.5">
          <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#C89B3C]" />
          <p className="flex-1 text-[10px] leading-relaxed text-[#E4C784]">
            {warning}
          </p>
          <button
            type="button"
            onClick={onRetry}
            className="shrink-0 text-[10px] font-semibold text-[#F5D793] underline decoration-[#C89B3C]/40 underline-offset-2 transition hover:text-[#FFF3D0]"
          >
            再取得
          </button>
        </div>
      )}

      {latest && <LatestCard entry={latest} gameVersion={data.gameVersion} />}

      {previous.length > 0 && (
        <section aria-labelledby="recent-patch-notes-heading">
          <div className="mb-2 flex items-center justify-between">
            <h3
              id="recent-patch-notes-heading"
              className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#A09B8C]"
            >
              最近のパッチノート
            </h3>
            <span className="text-[10px] tabular-nums text-[#A09B8C]/70">
              {previous.length}件
            </span>
          </div>
          <ul className="space-y-2">
            {previous.map((entry) => (
              <PatchListItem key={entry.id} entry={entry} />
            ))}
          </ul>
        </section>
      )}

      <a
        href={PATCH_NOTES_LIST_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center justify-between gap-3 rounded-lg border border-[#785A28]/40 bg-[#0A1428]/70 px-3.5 py-3 text-[11px] font-semibold text-[#F0E6D2] transition hover:border-[#C89B3C]/60 hover:bg-[#C89B3C]/[0.08]"
      >
        <span className="flex items-center gap-2">
          <ScrollIcon className="h-3.5 w-3.5 text-[#C89B3C]" />
          過去のパッチノート一覧を見る
        </span>
        <ExternalLinkIcon className="h-3.5 w-3.5 text-[#C89B3C]/70 transition group-hover:text-[#C89B3C]" />
      </a>

      <p className="text-center text-[10px] leading-relaxed text-[#A09B8C]/65">
        {data.source === 'official' ? '公式サイトから取得' : '保存済みデータ'}
        <span className="mx-1.5 text-[#785A28]">/</span>
        更新 {formatFetchedAt(data.fetchedAt)}
        {data.gameVersion && (
          <>
            <span className="mx-1.5 text-[#785A28]">/</span>
            Data Dragon {data.gameVersion}
          </>
        )}
      </p>
    </div>
  )
}

function LatestCard({
  entry,
  gameVersion,
}: {
  entry: PatchNoteEntry
  gameVersion: string | null
}) {
  return (
    <article className="overflow-hidden rounded-xl border border-[#C89B3C]/40 bg-[#0A1428] shadow-[0_16px_40px_rgba(0,0,0,0.35)]">
      <div className="relative aspect-[16/9] overflow-hidden bg-[#010A13]">
        {entry.thumbnail ? (
          <img
            src={entry.thumbnail}
            alt=""
            loading="lazy"
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover opacity-80"
          />
        ) : (
          <div className="hex-grid h-full w-full opacity-60" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A1428] via-[#0A1428]/35 to-transparent" />

        <div className="absolute left-3 top-3 flex flex-wrap items-center gap-1.5">
          <span className="rounded-full border border-[#C89B3C]/70 bg-[#010A13]/80 px-2.5 py-1 text-[10px] font-bold tracking-wider text-[#F5D793] backdrop-blur">
            PATCH {entry.version ?? '最新'}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-[#3FB68B]/60 bg-[#3FB68B]/15 px-2 py-1 text-[9px] font-semibold tracking-wider text-[#9BE8C8] backdrop-blur">
            <span className="h-1 w-1 rounded-full bg-[#3FB68B] shadow-[0_0_5px_rgba(63,182,139,0.9)]" />
            最新
          </span>
        </div>

        <div className="absolute inset-x-3 bottom-3">
          <p className="text-[10px] text-[#C8C3B5]">
            {formatPatchDate(entry.publishedAt)}
            {gameVersion && (
              <span className="ml-2 text-[#A09B8C]">ゲーム v{gameVersion}</span>
            )}
          </p>
          <h3 className="mt-1 text-sm font-bold leading-snug text-[#F0E6D2]">
            {entry.title}
          </h3>
        </div>
      </div>

      <div className="space-y-3 p-4">
        {entry.summary && (
          <p className="text-[11px] leading-relaxed text-[#A09B8C]">
            {entry.summary}
          </p>
        )}
        <a
          href={entry.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#C89B3C]/60 bg-[#C89B3C]/15 px-4 py-2.5 text-xs font-semibold text-[#F5D793] transition hover:border-[#C89B3C] hover:bg-[#C89B3C]/25"
        >
          公式サイトで全文を読む
          <ExternalLinkIcon className="h-3.5 w-3.5" />
        </a>
      </div>
    </article>
  )
}

function PatchListItem({ entry }: { entry: PatchNoteEntry }) {
  return (
    <li>
      <a
        href={entry.url}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex gap-3 rounded-lg border border-[#785A28]/30 bg-[#0A1428]/60 p-2.5 transition hover:border-[#C89B3C]/50 hover:bg-[#C89B3C]/[0.06]"
      >
        <div className="relative h-14 w-24 shrink-0 overflow-hidden rounded border border-[#785A28]/30 bg-[#010A13]">
          {entry.thumbnail ? (
            <img
              src={entry.thumbnail}
              alt=""
              loading="lazy"
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover opacity-75 transition group-hover:opacity-100"
            />
          ) : (
            <div className="hex-grid h-full w-full opacity-60" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            {entry.version && (
              <span className="rounded border border-[#C89B3C]/40 bg-[#C89B3C]/10 px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-[#E4C784]">
                v{entry.version}
              </span>
            )}
            <span className="text-[10px] text-[#A09B8C]">
              {formatPatchDate(entry.publishedAt)}
            </span>
          </div>
          <p className="mt-1 line-clamp-2 text-[11px] font-semibold leading-snug text-[#F0E6D2] transition group-hover:text-[#F5D793]">
            {entry.title}
          </p>
        </div>

        <ChevronRightIcon className="mt-1 h-3.5 w-3.5 shrink-0 text-[#C89B3C]/60 transition group-hover:translate-x-0.5 group-hover:text-[#C89B3C]" />
      </a>
    </li>
  )
}

function LoadingSkeleton() {
  return (
    <div
      className="space-y-5"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="パッチノートを読み込み中"
    >
      <div className="overflow-hidden rounded-xl border border-[#785A28]/30 bg-[#0A1428]">
        <div className="patch-skeleton aspect-[16/9] w-full" />
        <div className="space-y-3 p-4">
          <div className="patch-skeleton h-3 w-3/4 rounded" />
          <div className="patch-skeleton h-3 w-full rounded" />
          <div className="patch-skeleton h-3 w-5/6 rounded" />
          <div className="patch-skeleton h-9 w-full rounded-lg" />
        </div>
      </div>

      <div className="space-y-2">
        <div className="patch-skeleton h-3 w-28 rounded" />
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className="flex gap-3 rounded-lg border border-[#785A28]/20 bg-[#0A1428]/40 p-2.5"
          >
            <div className="patch-skeleton h-14 w-24 shrink-0 rounded" />
            <div className="flex-1 space-y-2 py-1">
              <div className="patch-skeleton h-2.5 w-16 rounded" />
              <div className="patch-skeleton h-3 w-full rounded" />
              <div className="patch-skeleton h-3 w-2/3 rounded" />
            </div>
          </div>
        ))}
      </div>

      <p className="text-center text-[10px] text-[#A09B8C]/70">
        最新のパッチノートを取得しています…
      </p>
    </div>
  )
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string
  onRetry: () => void
}) {
  return (
    <div
      className="flex min-h-[340px] flex-col items-center justify-center text-center"
      role="alert"
    >
      <div className="grid h-14 w-14 place-items-center rounded-full border border-[#E0645A]/40 bg-[#E0645A]/10 text-[#FFB9AE]">
        <ScrollIcon className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-sm font-bold text-[#F0E6D2]">
        パッチノートを取得できませんでした
      </h3>
      <p className="mt-2 max-w-[280px] text-[11px] leading-relaxed text-[#A09B8C]">
        {message}
      </p>

      <div className="mt-5 flex w-full max-w-[260px] flex-col gap-2">
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#C89B3C]/60 bg-[#C89B3C]/15 px-4 py-2.5 text-xs font-semibold text-[#F5D793] transition hover:border-[#C89B3C] hover:bg-[#C89B3C]/25"
        >
          <ResetIcon className="h-3.5 w-3.5" />
          再取得する
        </button>
        <a
          href={PATCH_NOTES_LIST_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#785A28]/50 bg-[#0A1428] px-4 py-2.5 text-xs font-semibold text-[#F0E6D2] transition hover:border-[#C89B3C]/60 hover:text-[#F5D793]"
        >
          公式サイトで確認する
          <ExternalLinkIcon className="h-3.5 w-3.5" />
        </a>
      </div>

      <p className="mt-4 text-[10px] leading-relaxed text-[#A09B8C]/60">
        公式サイトのパッチノート一覧から最新情報をご確認ください。
      </p>
    </div>
  )
}
