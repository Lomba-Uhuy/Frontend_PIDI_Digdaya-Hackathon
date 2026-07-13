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

  return (
    <div className={cn("flex w-full items-start", className)}>
      {normalized.map((step, idx) => (
        <div
          key={idx}
          className={cn("flex items-start", idx < normalized.length - 1 ? "flex-1" : "shrink-0")}
        >
          <div className="flex shrink-0 flex-col items-center gap-2">
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
          {idx < normalized.length - 1 && (
            <div
              className={cn(
                "mx-2 mt-4 h-[2px] flex-1 transition-colors duration-300",
                idx + 1 < currentStep ? "bg-primary" : "bg-surface-container-high"
              )}
            />
          )}
        </div>
      ))}
    </div>
  )
}

export { Stepper }
