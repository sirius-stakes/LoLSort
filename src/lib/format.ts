import data from '../data/champions.json'

export const DDRAGON_VERSION = data.meta.version

const CDN = `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}`

export function assetUrl(path: string): string {
  return `${CDN}/${path}`
}

export function formatDuration(duration: { min: number; max: number } | null): string {
  if (!duration) return '—'
  const min = trimNumber(duration.min)
  const max = trimNumber(duration.max)
  return min === max ? `${min}秒` : `${min}〜${max}秒`
}

export function formatCooldown(cooldown: { min: number; max: number } | null): string | null {
  if (!cooldown) return null
  const min = trimNumber(cooldown.min)
  const max = trimNumber(cooldown.max)
  return min === max ? `${min}秒` : `${min}〜${max}秒`
}

export function trimNumber(value: number): string {
  return Number(value.toFixed(2)).toString()
}
