import { useEffect, useMemo, useRef, useState } from 'react'
import { CHAMPIONS, CHAMPION_BY_KEY } from '../data/champions'
import { ChevronDownIcon, SearchIcon, XIcon } from './Icons'

interface ChampionComboboxProps {
  value: string
  onChange: (championKey: string) => void
  /** 選択不可にするチャンピオン（もう一方のスロットなど） */
  disabledKeys?: string[]
  placeholder?: string
  ariaLabel: string
  accent?: 'gold' | 'cyan'
  /** ドロップダウンの開閉状態を親コンテナへ通知する */
  onOpenChange?: (open: boolean) => void
}

/**
 * 顔アイコン + 名前 + 検索を備えたチャンピオン選択コンボボックス。
 * ネイティブ <select> では表現できないアイコン付き候補リストを提供する。
 */
export function ChampionCombobox({
  value,
  onChange,
  disabledKeys = [],
  placeholder = 'チャンピオンを選択',
  ariaLabel,
  accent = 'gold',
  onOpenChange,
}: ChampionComboboxProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  const rootRef = useRef<HTMLDivElement | null>(null)
  const searchInputRef = useRef<HTMLInputElement | null>(null)

  const updateOpen = (next: boolean) => {
    setOpen(next)
    onOpenChange?.(next)
  }

  const selected = value ? CHAMPION_BY_KEY.get(value) ?? null : null
  const disabledSet = useMemo(() => new Set(disabledKeys), [disabledKeys])

  const candidates = useMemo(() => {
    const normalized = query.trim().toLowerCase()

    return CHAMPIONS.filter((champion) => {
      if (!normalized) return true

      return [
        champion.championName,
        champion.championKey,
        ...champion.lanes,
        ...champion.roles,
      ]
        .join(' ')
        .toLowerCase()
        .includes(normalized)
    })
  }, [query])

  useEffect(() => {
    if (!open) return

    const handlePointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        updateOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') updateOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    searchInputRef.current?.focus()
  }, [open])

  const accentBorder =
    accent === 'gold' ? 'border-[#C89B3C]/55' : 'border-[#5AB0E0]/55'
  const accentText = accent === 'gold' ? 'text-[#F5D793]' : 'text-[#B5E4F7]'

  const handleToggle = () => {
    setQuery('')
    updateOpen(!open)
  }

  const handleSelect = (championKey: string) => {
    if (disabledSet.has(championKey)) return

    onChange(championKey)
    updateOpen(false)
    setQuery('')
  }

  return (
    <div ref={rootRef} className={`relative ${open ? 'z-[100]' : ''}`}>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={ariaLabel}
        onClick={handleToggle}
        className={`relative flex w-full items-center gap-2 rounded-lg border ${accentBorder} bg-[#010A13]/85 py-2 pl-2 pr-9 text-left transition hover:border-[#C89B3C]/80 focus:border-[#C89B3C]/80 focus:outline-none focus:ring-1 focus:ring-[#C89B3C]/30`}
      >
        {selected ? (
          <img
            src={selected.championIconUrl}
            alt=""
            loading="lazy"
            onError={(event) => {
              event.currentTarget.src = '/hex.svg'
            }}
            className="h-7 w-7 shrink-0 rounded-full border border-[#C89B3C]/50 bg-[#0A1428] object-cover"
          />
        ) : (
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-dashed border-[#785A28]/60 bg-[#0A1428] text-[10px] text-[#A09B8C]">
            ?
          </span>
        )}

        <span className="min-w-0 flex-1">
          <span
            className={`block truncate text-xs font-semibold ${
              selected ? accentText : 'text-[#A09B8C]'
            }`}
          >
            {selected ? selected.championName : placeholder}
          </span>
          {selected && (
            <span className="mt-0.5 block truncate text-[9px] text-[#A09B8C]">
              {selected.lanes.join(' / ')}
            </span>
          )}
        </span>

        <ChevronDownIcon
          className={`pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#C89B3C]/80 transition-transform ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 z-[100] mt-2 overflow-hidden rounded-xl border border-[#C89B3C] bg-[#091428] shadow-2xl">
          <div className="border-b border-[#785A28]/30 p-2.5">
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#C89B3C]/80" />
              <input
                ref={searchInputRef}
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="チャンピオン名で検索..."
                aria-label={`${ariaLabel}（検索）`}
                className="w-full rounded-lg border border-[#785A28]/50 bg-[#010A13]/80 py-2 pl-9 pr-9 text-xs text-[#F0E6D2] placeholder:text-[#A09B8C]/50 focus:border-[#C89B3C]/80 focus:outline-none focus:ring-1 focus:ring-[#C89B3C]/30"
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

          {candidates.length > 0 ? (
            <ul
              role="listbox"
              aria-label="チャンピオン一覧"
              className="rift-scroll max-h-72 overflow-y-auto p-1.5"
            >
              {candidates.map((champion) => {
                const active = champion.championKey === value
                const disabled = disabledSet.has(champion.championKey)

                return (
                  <li key={champion.championKey}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={active}
                      disabled={disabled}
                      onClick={() => handleSelect(champion.championKey)}
                      className={`flex w-full items-center gap-2.5 rounded-lg border px-2 py-1.5 text-left transition ${
                        active
                          ? 'border-[#C89B3C]/70 bg-[#C89B3C]/15'
                          : 'border-transparent hover:border-[#C89B3C]/35 hover:bg-[#C89B3C]/[0.06]'
                      } ${
                        disabled
                          ? 'cursor-not-allowed opacity-35'
                          : ''
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
                            active ? 'text-[#F5D793]' : 'text-[#F0E6D2]'
                          }`}
                        >
                          {champion.championName}
                        </span>
                        <span className="mt-0.5 block truncate text-[9px] text-[#A09B8C]">
                          {champion.lanes.join(' / ')}
                        </span>
                      </span>
                      {active && !disabled && (
                        <span className="shrink-0 text-[10px] font-bold text-[#C89B3C]">
                          ✓
                        </span>
                      )}
                      {disabled && (
                        <span className="shrink-0 text-[9px] text-[#A09B8C]/70">
                          選択中
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
              {candidates.length} / {CHAMPIONS.length} 体
            </span>
            <button
              type="button"
              onClick={() => updateOpen(false)}
              className="text-[10px] font-semibold text-[#C89B3C] underline decoration-[#C89B3C]/40 underline-offset-4 transition hover:text-[#F0E6D2]"
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
