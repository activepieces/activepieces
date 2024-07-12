"use client"
 
import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"
 
import { cn } from "@/lib/utils"
 
const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "ap-peer ap-inline-flex ap-h-6 ap-w-11 ap-shrink-0 ap-cursor-pointer ap-items-center ap-rounded-full ap-border-2 ap-border-transparent ap-transition-colors focus-visible:ap-outline-none focus-visible:ap-ring-2 focus-visible:ap-ring-ring focus-visible:ap-ring-offset-2 focus-visible:ap-ring-offset-background disabled:ap-cursor-not-allowed disabled:ap-opacity-50 data-[state=checked]:ap-bg-primary data-[state=unchecked]:ap-bg-input",
      className
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "ap-pointer-events-none ap-block ap-h-5 ap-w-5 ap-rounded-full ap-bg-background ap-shadow-lg ap-ring-0 ap-transition-transform data-[state=checked]:ap-translate-x-5 data-[state=unchecked]:ap-translate-x-0"
      )}
    />
  </SwitchPrimitives.Root>
))
Switch.displayName = SwitchPrimitives.Root.displayName
 
export { Switch }