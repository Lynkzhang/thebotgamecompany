import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs leading-none font-semibold",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-gradient-to-r from-fuchsia-500 to-violet-500 text-white",
        secondary:
          "border-transparent bg-fuchsia-50 dark:bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-200",
        outline: "border-fuchsia-200 dark:border-fuchsia-400/20 text-fuchsia-700 dark:text-fuchsia-200 bg-white/60 dark:bg-white/5",
        success:
          "border-transparent bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-200",
        warning:
          "border-transparent bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-200",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({ className, variant, ...props }) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
