"use client"

import { cn } from "@/lib/utils"

// Glassmorphism card: translucent background, subtle border, blur, and shadow
export function NeonGradientCard({
  className,
  children,
  rounded = "rounded-2xl",
  padding = "p-6 sm:p-8",
}) {
  return (
    <div
      className={cn(
        "relative w-full overflow-hidden",
        rounded,
        // glass background tuned for both themes
        "bg-surface/70 dark:bg-white/5 backdrop-blur-md",
        // subtle inner/outer borders for depth
        "border border-border/50 dark:border-white/10",
        // light glow shadow
        "shadow-[0_8px_30px_rgba(0,0,0,0.12)]",
        className
      )}
    >
      <div className={cn("relative", padding)}>{children}</div>
    </div>
  )
}

export function NeonGradientCardDemo() {
  return (
    <NeonGradientCard className="max-w-sm text-center">
      <span className="text-3xl font-semibold text-foreground">Glass Card</span>
    </NeonGradientCard>
  )
}
