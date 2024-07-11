import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "ap-flex ap-h-10 ap-w-full ap-rounded-md ap-border ap-border-input ap-bg-background ap-px-3 ap-py-2 ap-text-sm ap-ring-offset-background file:ap-border-0 file:ap-bg-transparent file:ap-text-sm file:ap-font-medium placeholder:ap-text-muted-foreground focus-visible:ap-outline-none focus-visible:ap-ring-2 focus-visible:ap-ring-ring focus-visible:ap-ring-offset-2 disabled:ap-cursor-not-allowed disabled:ap-opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
