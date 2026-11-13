import type { DamageType, EffectDetail } from '../../types/skill'
import { DAMAGE_TYPE_META, EFFECT_CATEGORY_META } from './meta'

interface EffectBadgeProps {
  effect: EffectDetail
}

export function EffectBadge({ effect }: EffectBadgeProps) {
  const meta = EFFECT_CATEGORY_META[effect.category]

  return (
    <span
      title={`${meta.label} / ${effect.label}`}
      className={`inline-flex items-center gap-1.5 rounded border px-1.5 py-0.5 text-[10px] font-medium leading-none ${meta.badge}`}
    >
      <span className={`h-1 w-1 shrink-0 rounded-full ${meta.dot}`} />
      {effect.label}
    </span>
  )
}

interface DamageBadgeProps {
  type: DamageType
}

/** スキルカード用のダメージ属性バッジ（物理 / 魔法 / 確定） */
export function DamageBadge({ type }: DamageBadgeProps) {
  const meta = DAMAGE_TYPE_META[type]

  return (
    <span
      title={`${meta.filterLabel} — ${meta.description}`}
      className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[9px] font-bold leading-none ${meta.badge}`}
    >
      {meta.label}
    </span>
  )
}
