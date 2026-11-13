import { CATEGORY_STYLES, TAGS, type TagId } from '../data/tags'

interface TagBadgeProps {
  tag: string
  className?: string
}

export function TagBadge({ tag, className = '' }: TagBadgeProps) {
  const definition = TAGS[tag as TagId]
  if (!definition) return null
  const style = CATEGORY_STYLES[definition.category]

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded border px-1.5 py-0.5 text-[10px] font-medium leading-none ${style.badge} ${className}`}
    >
      <span className={`h-1 w-1 rounded-full ${style.dot}`} />
      {definition.label}
    </span>
  )
}
