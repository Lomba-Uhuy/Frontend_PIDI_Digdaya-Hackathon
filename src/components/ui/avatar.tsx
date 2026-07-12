import { cn } from "@/lib/utils"

interface AvatarProps {
  name: string
  initials?: string
  size?: "sm" | "md" | "lg"
  shape?: "square" | "circle"
  className?: string
}

const PALETTES = [
  "bg-primary-container text-on-primary-container",
  "bg-secondary-container text-on-secondary-container",
  "bg-info-container text-on-info-container",
  "bg-warning-container text-on-warning-container",
  "bg-surface-container-high text-on-surface-variant",
]

const SIZE_CLASSES = {
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-12 text-base",
}

function hashString(value: string) {
  let hash = 0
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function Avatar({ name, initials, size = "md", shape = "square", className }: AvatarProps) {
  const palette = PALETTES[hashString(name) % PALETTES.length]
  const display = initials ?? getInitials(name)

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center font-black select-none",
        shape === "circle" ? "rounded-full" : "rounded-lg",
        SIZE_CLASSES[size],
        palette,
        className
      )}
      title={name}
    >
      {display}
    </div>
  )
}

export { Avatar }
