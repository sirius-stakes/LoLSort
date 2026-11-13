export function formatSeconds(duration: number): string {
  return Number.isInteger(duration)
    ? `${duration.toFixed(1)}s`
    : `${Number(duration.toFixed(2))}s`
}

export function maxEffectDuration(durations: Array<number | undefined>): number | null {
  const values = durations.filter((value): value is number => typeof value === 'number')
  if (values.length === 0) return null
  return Math.max(...values)
}
