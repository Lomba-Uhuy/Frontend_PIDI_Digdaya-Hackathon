import { cn } from "@/lib/utils"

interface ProgressRingProps {
  value: number
  size?: number
  strokeWidth?: number
  trackClassName?: string
  progressClassName?: string
  children?: React.ReactNode
  className?: string
}

function ProgressRing({
  value,
  size = 112,
  strokeWidth = 12,
  trackClassName = "text-surface-variant",
  progressClassName = "text-secondary",
  children,
  className,
}: ProgressRingProps) {
  const clamped = Math.min(100, Math.max(0, value))
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - clamped / 100)
  const center = size / 2

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90 transition-all duration-500">
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className={trackClassName}
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={cn("drop-shadow-sm transition-all duration-700 ease-out", progressClassName)}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {children ?? <span className="text-4xl font-bold text-on-surface">{Math.round(clamped)}</span>}
      </div>
    </div>
  )
}

export { ProgressRing }
