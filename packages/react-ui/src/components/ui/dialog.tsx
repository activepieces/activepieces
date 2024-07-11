import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const Dialog = DialogPrimitive.Root

const DialogTrigger = DialogPrimitive.Trigger

const DialogPortal = DialogPrimitive.Portal

const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "ap-fixed ap-inset-0 ap-z-50 ap-bg-black/80 ap- data-[state=open]:ap-animate-in data-[state=closed]:ap-animate-out data-[state=closed]:ap-fade-out-0 data-[state=open]:ap-fade-in-0",
      className
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "ap-fixed ap-left-[50%] ap-top-[50%] ap-z-50 ap-grid ap-w-full ap-max-w-lg ap-translate-x-[-50%] ap-translate-y-[-50%] ap-gap-4 ap-border ap-bg-background ap-p-6 ap-shadow-lg ap-duration-200 data-[state=open]:ap-animate-in data-[state=closed]:ap-animate-out data-[state=closed]:ap-fade-out-0 data-[state=open]:ap-fade-in-0 data-[state=closed]:ap-zoom-out-95 data-[state=open]:ap-zoom-in-95 data-[state=closed]:ap-slide-out-to-left-1/2 data-[state=closed]:ap-slide-out-to-top-[48%] data-[state=open]:ap-slide-in-from-left-1/2 data-[state=open]:ap-slide-in-from-top-[48%] sm:ap-rounded-lg",
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="ap-absolute ap-right-4 ap-top-4 ap-rounded-sm ap-opacity-70 ap-ring-offset-background ap-transition-opacity hover:ap-opacity-100 focus:ap-outline-none focus:ap-ring-2 focus:ap-ring-ring focus:ap-ring-offset-2 disabled:ap-pointer-events-none data-[state=open]:ap-bg-accent data-[state=open]:ap-text-muted-foreground">
        <X className="ap-h-4 ap-w-4" />
        <span className="ap-sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
))
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "ap-flex ap-flex-col ap-space-y-1.5 ap-text-center sm:ap-text-left",
      className
    )}
    {...props}
  />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "ap-flex ap-flex-col-reverse sm:ap-flex-row sm:ap-justify-end sm:ap-space-x-2",
      className
    )}
    {...props}
  />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "ap-text-lg ap-font-semibold ap-leading-none ap-tracking-tight",
      className
    )}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("ap-text-sm ap-text-muted-foreground", className)}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
