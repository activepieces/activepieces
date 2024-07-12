"use client"

import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"

import { cn } from "@/lib/utils"

const TooltipProvider = TooltipPrimitive.Provider

const Tooltip = TooltipPrimitive.Root

const TooltipTrigger = TooltipPrimitive.Trigger

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(
      "ap-z-50 ap-overflow-hidden ap-rounded-md ap-border ap-bg-popover ap-px-3 ap-py-1.5 ap-text-sm ap-text-popover-foreground ap-shadow-md ap-animate-in ap-fade-in-0 ap-zoom-in-95 data-[state=closed]:ap-animate-out data-[state=closed]:ap-fade-out-0 data-[state=closed]:ap-zoom-out-95 data-[side=bottom]:ap-slide-in-from-top-2 data-[side=left]:ap-slide-in-from-right-2 data-[side=right]:ap-slide-in-from-left-2 data-[side=top]:ap-slide-in-from-bottom-2",
      className
    )}
    {...props}
  />
))
TooltipContent.displayName = TooltipPrimitive.Content.displayName

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
