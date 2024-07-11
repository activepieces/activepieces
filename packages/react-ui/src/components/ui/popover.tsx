import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"

import { cn } from "@/lib/utils"

const Popover = PopoverPrimitive.Root

const PopoverTrigger = PopoverPrimitive.Trigger

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = "center", sideOffset = 4, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(
        "ap-z-50 ap-w-72 ap-rounded-md ap-border ap-bg-popover ap-p-4 ap-text-popover-foreground ap-shadow-md ap-outline-none data-[state=open]:ap-animate-in data-[state=closed]:ap-animate-out data-[state=closed]:ap-fade-out-0 data-[state=open]:ap-fade-in-0 data-[state=closed]:ap-zoom-out-95 data-[state=open]:ap-zoom-in-95 data-[side=bottom]:ap-slide-in-from-top-2 data-[side=left]:ap-slide-in-from-right-2 data-[side=right]:ap-slide-in-from-left-2 data-[side=top]:ap-slide-in-from-bottom-2",
        className
      )}
      {...props}
    />
  </PopoverPrimitive.Portal>
))
PopoverContent.displayName = PopoverPrimitive.Content.displayName

export { Popover, PopoverTrigger, PopoverContent }
