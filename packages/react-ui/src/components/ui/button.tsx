import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "ap-inline-flex ap-items-center ap-justify-center ap-whitespace-nowrap ap-rounded-md ap-text-sm ap-font-medium ap-ring-offset-background ap-transition-colors focus-visible:ap-outline-none focus-visible:ap-ring-2 focus-visible:ap-ring-ring focus-visible:ap-ring-offset-2 disabled:ap-pointer-events-none disabled:ap-opacity-50",
  {
    variants: {
      variant: {
        default: "ap-bg-primary ap-text-primary-foreground hover:ap-bg-primary/90",
        destructive:
          "ap-bg-destructive ap-text-destructive-foreground hover:ap-bg-destructive/90",
        outline:
          "ap-border ap-border-input ap-bg-background hover:ap-bg-accent hover:ap-text-accent-foreground",
        secondary:
          "ap-bg-secondary ap-text-secondary-foreground hover:ap-bg-secondary/80",
        ghost: "hover:ap-bg-accent hover:ap-text-accent-foreground",
        link: "ap-text-primary ap-underline-offset-4 hover:ap-underline",
      },
      size: {
        default: "ap-h-10 ap-px-4 ap-py-2",
        sm: "ap-h-9 ap-rounded-md ap-px-3",
        lg: "ap-h-11 ap-rounded-md ap-px-8",
        icon: "ap-h-10 ap-w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }), {})}
        ref={ref}
        {...props}
      >
        {loading ? <span className="ap-animate-spin ap-text-white"></span> : children}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
