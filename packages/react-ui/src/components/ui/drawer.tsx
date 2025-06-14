'use client';

import * as React from 'react';
import { Drawer as DrawerPrimitive } from 'vaul';

import { cn } from '@/lib/utils';

const DrawerContext = React.createContext<{
  className?: string;
  disableAutoFocus?: boolean;
  dismissible?: boolean;
  direction?: 'left' | 'right' | 'top' | 'bottom';
}>({
  className: undefined,
  disableAutoFocus: false,
  dismissible: true,
  direction: 'right',
});

const Drawer = ({
  shouldScaleBackground = true,
  className,
  disableAutoFocus = false,
  dismissible = true,
  direction = 'right',
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Root> & {
  className?: string;
  disableAutoFocus?: boolean;
  dismissible?: boolean;
  direction?: 'left' | 'right' | 'top' | 'bottom';
}) => (
  <DrawerContext.Provider
    value={{ className, disableAutoFocus, dismissible, direction }}
  >
    <DrawerPrimitive.Root
      dismissible={dismissible}
      shouldScaleBackground={shouldScaleBackground}
      direction={direction}
      {...props}
    />
  </DrawerContext.Provider>
);
Drawer.displayName = 'Drawer';

const DrawerTrigger = DrawerPrimitive.Trigger;
const DrawerClose = DrawerPrimitive.Close;
const DrawerPortal = DrawerPrimitive.Portal;

type DrawerContentProps = React.ComponentPropsWithoutRef<
  typeof DrawerPrimitive.Content
>;

const DrawerContent = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Content>,
  DrawerContentProps
>(({ className: contentClassName, children, ...props }, ref) => {
  const context = React.useContext(DrawerContext);
  const drawerClassName = context.className;

  return (
    <DrawerPortal>
      <DrawerPrimitive.Content
        ref={ref}
        className={cn(
          'fixed inset-y-0 right-0 z-50 h-full flex flex-col border bg-background shadow-lg outline-none',
          drawerClassName ?? 'w-3/4 max-w-md',
          contentClassName,
        )}
        style={{ userSelect: 'text', ...props.style }}
        {...props}
      >
        {children}
      </DrawerPrimitive.Content>
    </DrawerPortal>
  );
});
DrawerContent.displayName = 'DrawerContent';

const DrawerHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('grid gap-1.5 text-center sm:text-left', className)}
    {...props}
  />
);
DrawerHeader.displayName = 'DrawerHeader';

const DrawerFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('mt-auto flex gap-2 p-4', className)} {...props} />
);
DrawerFooter.displayName = 'DrawerFooter';

const DrawerTitle = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Title
    ref={ref}
    className={cn(
      'text-lg font-semibold leading-none tracking-tight',
      className,
    )}
    {...props}
  />
));
DrawerTitle.displayName = DrawerPrimitive.Title.displayName;

const DrawerDescription = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Description
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
));
DrawerDescription.displayName = DrawerPrimitive.Description.displayName;

export {
  Drawer,
  DrawerPortal,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
};
