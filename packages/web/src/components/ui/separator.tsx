import * as React from "react"
import { Separator as SeparatorPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function Separator({
  className,
  orientation = "horizontal",
  decorative = true,
  ...props
}: React.ComponentProps<typeof SeparatorPrimitive.Root>) {
  return (
    <SeparatorPrimitive.Root
      data-slot="separator"
      decorative={decorative}
      orientation={orientation}
      className={cn(
        "shrink-0 bg-border data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px",
        className
      )}
      {...props}
    />
  )
}

function HorizontalSeparatorWithText({
  className,
  children,
}: HorizontalSeparatorWithTextProps) {
  return (
    <div className={cn("flex w-full flex-row items-center", className)}>
      <div className="w-1/2 border" />
      <span className="mx-2 text-sm">{children}</span>
      <div className="w-1/2 border" />
    </div>
  )
}

export { Separator, HorizontalSeparatorWithText }

type HorizontalSeparatorWithTextProps = {
  className?: string
  children: React.ReactNode
}
