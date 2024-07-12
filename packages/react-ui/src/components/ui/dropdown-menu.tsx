"use client"

import * as React from "react"
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu"
import { Check, ChevronRight, Circle } from "lucide-react"

import { cn } from "@/lib/utils"

const DropdownMenu = DropdownMenuPrimitive.Root

const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger

const DropdownMenuGroup = DropdownMenuPrimitive.Group

const DropdownMenuPortal = DropdownMenuPrimitive.Portal

const DropdownMenuSub = DropdownMenuPrimitive.Sub

const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup

const DropdownMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> & {
    inset?: boolean
  }
>(({ className, inset, children, ...props }, ref) => (
  <DropdownMenuPrimitive.SubTrigger
    ref={ref}
    className={cn(
      "ap-flex ap-cursor-default ap-select-none ap-items-center ap-rounded-sm ap-px-2 ap-py-1.5 ap-text-sm ap-outline-none focus:ap-bg-accent data-[state=open]:ap-bg-accent",
      inset && "ap-pl-8",
      className
    )}
    {...props}
  >
    {children}
    <ChevronRight className="ap-ml-auto ap-h-4 ap-w-4" />
  </DropdownMenuPrimitive.SubTrigger>
))
DropdownMenuSubTrigger.displayName =
  DropdownMenuPrimitive.SubTrigger.displayName

const DropdownMenuSubContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.SubContent
    ref={ref}
    className={cn(
      "ap-z-50 ap-min-w-[8rem] ap-overflow-hidden ap-rounded-md ap-border ap-bg-popover ap-p-1 ap-text-popover-foreground ap-shadow-lg data-[state=open]:ap-animate-in data-[state=closed]:ap-animate-out data-[state=closed]:ap-fade-out-0 data-[state=open]:ap-fade-in-0 data-[state=closed]:ap-zoom-out-95 data-[state=open]:ap-zoom-in-95 data-[side=bottom]:ap-slide-in-from-top-2 data-[side=left]:ap-slide-in-from-right-2 data-[side=right]:ap-slide-in-from-left-2 data-[side=top]:ap-slide-in-from-bottom-2",
      className
    )}
    {...props}
  />
))
DropdownMenuSubContent.displayName =
  DropdownMenuPrimitive.SubContent.displayName

const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "ap-z-50 ap-min-w-[8rem] ap-overflow-hidden ap-rounded-md ap-border ap-bg-popover ap-p-1 ap-text-popover-foreground ap-shadow-md ap-data-[state=open]:ap-animate-in ap-data-[state=closed]:ap-animate-out ap-data-[state=closed]:fade-out-0 ap-data-[state=open]:fade-in-0 ap-data-[state=closed]:zoom-out-95 ap-data-[state=open]:zoom-in-95 ap-data-[side=bottom]:slide-in-from-top-2 ap-data-[side=left]:slide-in-from-right-2 ap-data-[side=right]:slide-in-from-left-2 ap-data-[side=top]:slide-in-from-bottom-2",
         className
      )}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
))
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName

const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={cn(
      "ap-relative ap-flex ap-cursor-default ap-select-none ap-items-center ap-rounded-sm ap-px-2 ap-py-1.5 ap-text-sm ap-outline-none ap-transition-colors focus:ap-bg-accent focus:ap-text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      inset && "ap-pl-8",
      className
    )}
    {...props}
  />
))
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName

const DropdownMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <DropdownMenuPrimitive.CheckboxItem
    ref={ref}
    className={cn(
      "ap-relative ap-flex ap-cursor-default ap-select-none ap-items-center ap-rounded-sm ap-py-1.5 ap-pl-8 ap-pr-2 ap-text-sm ap-outline-none ap-transition-colors focus:ap-bg-accent focus:ap-text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    checked={checked}
    {...props}
  >
    <span className="ap-absolute ap-left-2 ap-flex ap-h-3.5 ap-w-3.5 ap-items-center ap-justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Check className="ap-h-4 ap-w-4" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.CheckboxItem>
))
DropdownMenuCheckboxItem.displayName =
  DropdownMenuPrimitive.CheckboxItem.displayName

const DropdownMenuRadioItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
  <DropdownMenuPrimitive.RadioItem
    ref={ref}
    className={cn(
      "ap-relative ap-flex ap-cursor-default ap-select-none ap-items-center ap-rounded-sm ap-py-1.5 ap-pl-8 ap-pr-2 ap-text-sm ap-outline-none ap-transition-colors ap-focus:ap-bg-accent ap-focus:ap-text-accent-foreground ap-data-[disabled]:ap-pointer-events-none ap-data-[disabled]:ap-opacity-50",
      className
    )}
    {...props}
  >
    <span className="ap-absolute ap-left-2 ap-flex ap-h-3.5 ap-w-3.5 ap-items-center ap-justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Circle className="ap-h-2 ap-w-2 ap-fill-current" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.RadioItem>
))
DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName

const DropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    className={cn(
      "ap-px-2 ap-py-1.5 ap-text-sm ap-font-semibold",
      inset && "ap-pl-8",
      className
    )}
    {...props}
  />
))
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName

const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn("ap--mx-1 ap-my-1 ap-h-px ap-bg-muted", className)}
    {...props}
  />
))
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName

const DropdownMenuShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn("ap-ml-auto ap-text-xs ap-tracking-widest ap-opacity-60", className)}
      {...props}
    />
  )
}
DropdownMenuShortcut.displayName = "DropdownMenuShortcut"

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
}
