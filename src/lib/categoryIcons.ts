import {
  Car,
  Gamepad2,
  HeartPulse,
  Home,
  Tag,
  UtensilsCrossed,
  Wallet,
  type LucideIcon,
} from 'lucide-react'

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Alimentation: UtensilsCrossed,
  Transport: Car,
  Logement: Home,
  Santé: HeartPulse,
  Loisirs: Gamepad2,
  Salaire: Wallet,
}

export function getCategoryIcon(name: string): LucideIcon {
  return CATEGORY_ICONS[name] ?? Tag
}
