import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

type StepStatus = "complete" | "active" | "pending"

interface StepperStep {
  label: string
  status?: StepStatus
}

interface StepperProps {
  steps: (StepperStep | string)[]
  currentStep: number
  className?: string
}

function Stepper({ steps, currentStep, className }: StepperProps) {
  const normalized = steps.map((step, idx) => {
    const label = typeof step === "string" ? step : step.label
    const explicitStatus = typeof step === "string" ? undefined : step.status
    const status: StepStatus =
      explicitStatus ??
      (idx + 1 < currentStep ? "complete" : idx + 1 === currentStep ? "active" : "pending")
    return { label, status }
  })

  const progressPercent =
    normalized.length > 1 ? ((currentStep - 1) / (normalized.length - 1)) * 100 : 0

  return (
    <div className={cn("relative flex w-full items-start justify-between", className)}>
      <div className="absolute left-0 top-4 h-[2px] w-full bg-surface-container-high" />
      <div
        className="absolute left-0 top-4 h-[2px] bg-primary transition-all duration-300"
        style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
      />

      {normalized.map((step, idx) => (
        <div key={idx} className="relative z-10 flex flex-col items-center gap-2 bg-background px-2">
          <div
            className={cn(
              "flex size-8 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors",
              step.status === "complete" && "bg-primary text-on-primary border-primary",
              step.status === "active" && "bg-primary text-on-primary border-primary shadow-md",
              step.status === "pending" &&
                "bg-surface-container-lowest text-on-surface-variant border-outline-variant"
            )}
          >
            {step.status === "complete" ? <Check className="size-4" /> : idx + 1}
          </div>
          <span
            className={cn(
              "text-[10px] sm:text-xs font-bold uppercase tracking-widest text-center",
              step.status === "pending" ? "text-on-surface-variant" : "text-primary"
            )}
          >
            {step.label}
          </span>
        </div>
      ))}
    </div>
  )
}

export { Stepper }
