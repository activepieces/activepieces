import * as React from 'react';
import { Drawer as DrawerPrimitive } from 'vaul';

import { cn } from '@/lib/utils';

const RightDrawerContext = React.createContext<{
  className?: string;
  disableAutoFocus?: boolean;
}>({
  className: undefined,
  disableAutoFocus: false,
});

const RightDrawer = ({
  shouldScaleBackground = true,
  className,
  disableAutoFocus = false,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Root> & {
  className?: string;
  disableAutoFocus?: boolean;
}) => (
  <RightDrawerContext.Provider value={{ className, disableAutoFocus }}>
    <DrawerPrimitive.Root
      direction="right"
      shouldScaleBackground={shouldScaleBackground}
      {...props}
    />
  </RightDrawerContext.Provider>
);
RightDrawer.displayName = 'RightDrawer';

const RightDrawerTrigger = DrawerPrimitive.Trigger;
const RightDrawerClose = DrawerPrimitive.Close;
const RightDrawerPortal = DrawerPrimitive.Portal;

const RightDrawerOverlay = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Overlay
    ref={ref}
    className={cn('fixed inset-0 z-50 bg-transparent', className)}
    {...props}
  />
));
RightDrawerOverlay.displayName = 'RightDrawerOverlay';

const RightDrawerContent = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Content>
>(({ className: contentClassName, children, ...props }, ref) => {
  const { className: drawerClassName } = React.useContext(RightDrawerContext);

  return (
    <RightDrawerPortal>
      <RightDrawerOverlay />
      <DrawerPrimitive.Content
        ref={ref}
        className={cn(
          'fixed inset-y-0 right-0 z-50 h-full flex flex-col border bg-background shadow-lg',
          drawerClassName || 'w-3/4 max-w-md', // Apply drawer className or default width
          contentClassName, // Apply content className (has higher priority)
        )}
        style={{ userSelect: 'text', ...props.style }}
        {...props}
      >
        {children}
      </DrawerPrimitive.Content>
    </RightDrawerPortal>
  );
});
RightDrawerContent.displayName = 'RightDrawerContent';

const RightDrawerHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('grid gap-1.5 text-center sm:text-left', className)}
    {...props}
  />
);
RightDrawerHeader.displayName = 'RightDrawerHeader';

const RightDrawerFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('mt-auto flex gap-2 p-4', className)} {...props} />
);
RightDrawerFooter.displayName = 'RightDrawerFooter';

const RightDrawerTitle = React.forwardRef<
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
RightDrawerTitle.displayName = 'RightDrawerTitle';

const RightDrawerDescription = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Description
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
));
RightDrawerDescription.displayName = 'RightDrawerDescription';

export {
  RightDrawer,
  RightDrawerPortal,
  RightDrawerOverlay,
  RightDrawerTrigger,
  RightDrawerClose,
  RightDrawerContent,
  RightDrawerHeader,
  RightDrawerFooter,
  RightDrawerTitle,
  RightDrawerDescription,
};
