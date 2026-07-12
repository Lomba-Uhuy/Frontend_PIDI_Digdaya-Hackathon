import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border font-bold uppercase tracking-wider whitespace-nowrap",
  {
    variants: {
      variant: {
        success: "bg-secondary-container text-on-secondary-container border-secondary/30",
        warning: "bg-warning-container text-on-warning-container border-warning/30",
        danger: "bg-error-container text-on-error-container border-error/30",
        info: "bg-info-container text-on-info-container border-info/30",
        neutral: "bg-surface-container-high text-on-surface-variant border-outline-variant",
      },
      size: {
        sm: "text-[10px] px-2 py-0.5 [&_svg]:size-3",
        md: "text-xs px-2.5 py-1 [&_svg]:size-3.5",
      },
    },
    defaultVariants: {
      variant: "neutral",
      size: "sm",
    },
  }
)

interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  icon?: React.ComponentType<{ className?: string }>
}

function Badge({ className, variant, size, icon: Icon, children, ...props }: BadgeProps) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant, size, className }))}
      {...props}
    >
      {Icon && <Icon className="shrink-0" />}
      {children}
    </span>
  )
}

export { Badge, badgeVariants }
