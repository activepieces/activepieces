import * as React from "react"
import { type DialogProps } from "@radix-ui/react-dialog"
import { Command as CommandPrimitive } from "cmdk"
import { Search } from "lucide-react"

import { cn } from "@/lib/utils"
import { Dialog, DialogContent } from "@/components/ui/dialog"

const Command = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive>
>(({ className, ...props }, ref) => (
  <CommandPrimitive
    ref={ref}
    className={cn(
      "ap-flex ap-h-full ap-w-full ap-flex-col ap-overflow-hidden ap-rounded-md ap-bg-popover ap-text-popover-foreground",
      className
    )}
    {...props}
  />
))
Command.displayName = CommandPrimitive.displayName

interface CommandDialogProps extends DialogProps { }

const CommandDialog = ({ children, ...props }: CommandDialogProps) => {
  return (
    <Dialog {...props}>
      <DialogContent className="ap-overflow-hidden ap-p-0 ap-shadow-lg">
        <Command className="[&_[cmdk-group-heading]]:ap-px-2 [&_[cmdk-group-heading]]:ap-font-medium [&_[cmdk-group-heading]]:ap-text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:ap-pt-0 [&_[cmdk-group]]:ap-px-2 [&_[cmdk-input-wrapper]_svg]:ap-h-5 [&_[cmdk-input-wrapper]_svg]:ap-w-5 [&_[cmdk-input]]:ap-h-12 [&_[cmdk-item]]:ap-px-2 [&_[cmdk-item]]:ap-py-3 [&_[cmdk-item]_svg]:ap-h-5 [&_[cmdk-item]_svg]:ap-w-5">
          {children}
        </Command>
      </DialogContent>
    </Dialog>
  )
}

const CommandInput = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Input>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input>
>(({ className, ...props }, ref) => (
  <div className="ap-flex ap-items-center ap-border-b ap-px-3" cmdk-input-wrapper="">
    <Search className="ap-mr-2 ap-h-4 ap-w-4 ap-shrink-0 ap-opacity-50" />
    <CommandPrimitive.Input
      ref={ref}
      className={cn(
        "ap-flex ap-h-11 ap-w-full ap-rounded-md ap-bg-transparent ap-py-3 ap-text-sm ap-outline-none placeholder:ap-text-muted-foreground",
        { "ap-cursor-not-allowed ap-opacity-50": props.disabled },
        className
      )}
      {...props}
    />
  </div>
))

CommandInput.displayName = CommandPrimitive.Input.displayName

const CommandList = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.List>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.List
    ref={ref}
    className={cn("ap-max-h-[300px] ap-overflow-y-auto ap-overflow-x-hidden", className)}
    {...props}
  />
))

CommandList.displayName = CommandPrimitive.List.displayName

const CommandEmpty = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Empty>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Empty>
>((props, ref) => (
  <CommandPrimitive.Empty
    ref={ref}
    className="ap-py-6 ap-text-center ap-text-sm"
    {...props}
  />
))

CommandEmpty.displayName = CommandPrimitive.Empty.displayName

const CommandGroup = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Group>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Group>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Group
    ref={ref}
    className={cn(
      "ap-overflow-hidden ap-p-1 ap-text-foreground [&_[cmdk-group-heading]]:ap-px-2 [&_[cmdk-group-heading]]:ap-py-1.5 [&_[cmdk-group-heading]]:ap-text-xs [&_[cmdk-group-heading]]:ap-font-medium [&_[cmdk-group-heading]]:ap-text-muted-foreground",
      className
    )}
    {...props}
  />
))

CommandGroup.displayName = CommandPrimitive.Group.displayName

const CommandSeparator = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Separator
    ref={ref}
    className={cn("ap--mx-1 ap-h-px ap-bg-border", className)}
    {...props}
  />
))
CommandSeparator.displayName = CommandPrimitive.Separator.displayName

const CommandItem = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item>
>(({ className, disabled, ...props }, ref) => (
  <CommandPrimitive.Item
    ref={ref}
    className={cn(
      "ap-relative ap-flex ap-cursor-default ap-select-none ap-items-center ap-rounded-sm ap-px-2 ap-py-1.5 ap-text-sm ap-outline-none aria-selected:ap-bg-accent aria-selected:ap-text-accent-foreground",
      { "ap-pointer-events-none ap-opacity-50": disabled },
      className
    )}
    disabled={disabled}
    {...props}
  />
))

CommandItem.displayName = CommandPrimitive.Item.displayName

const CommandShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn(
        "ap-ml-auto ap-text-xs ap-tracking-widest ap-text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}
CommandShortcut.displayName = "CommandShortcut"

export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
}
