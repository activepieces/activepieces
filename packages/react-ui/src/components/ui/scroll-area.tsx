'use client';
import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area';
import * as React from 'react';

import { cn } from '@/lib/utils';

const ScrollArea = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root> & {
    viewPortClassName?: string;
    orientation?: 'vertical' | 'horizontal';
    viewPortRef?: React.RefObject<HTMLDivElement>;
    showGradient?: boolean;
    gradientClassName?: string;
  }
>(
  (
    {
      className,
      children,
      viewPortClassName,
      viewPortRef,
      orientation = 'vertical',
      showGradient = false,
      gradientClassName,
      ...props
    },
    ref,
  ) => {
    const [showBottomGradient, setShowBottomGradient] = React.useState(false);
    const internalViewPortRef = React.useRef<HTMLDivElement>(null);
    const viewportRef = viewPortRef || internalViewPortRef;

    React.useEffect(() => {
      if (!showGradient || !viewportRef.current) return;

      const viewport = viewportRef.current;
      const checkScroll = () => {
        const { scrollTop, scrollHeight, clientHeight } = viewport;
        const hasScrollableContent = scrollHeight > clientHeight;
        const isAtBottom = scrollTop + clientHeight >= scrollHeight - 1;

        setShowBottomGradient(hasScrollableContent && !isAtBottom);
      };

      checkScroll();
      viewport.addEventListener('scroll', checkScroll);

      const resizeObserver = new ResizeObserver(checkScroll);
      if (viewport.firstElementChild) {
        resizeObserver.observe(viewport.firstElementChild);
      }

      return () => {
        viewport.removeEventListener('scroll', checkScroll);
        resizeObserver.disconnect();
      };
    }, [showGradient, viewportRef]);

    return (
      <ScrollAreaPrimitive.Root
        ref={ref}
        className={cn('relative overflow-hidden', className)}
        {...props}
      >
        <ScrollAreaPrimitive.Viewport
          className={cn(
            'size-full rounded-[inherit] [&>div]:!block',
            viewPortClassName,
          )}
          ref={viewportRef}
        >
          {children}
        </ScrollAreaPrimitive.Viewport>
        <ScrollBar orientation={orientation} />
        <ScrollAreaPrimitive.Corner />

        {showGradient && showBottomGradient && (
          <div
            className={cn(
              'pointer-events-none absolute bottom-0 left-0 right-0 h-1/5 bg-gradient-to-t from-sidebar to-transparent',
              gradientClassName,
            )}
          />
        )}
      </ScrollAreaPrimitive.Root>
    );
  },
);
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName;

const ScrollBar = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>
>(({ className, orientation = 'vertical', ...props }, ref) => (
  <ScrollAreaPrimitive.ScrollAreaScrollbar
    ref={ref}
    orientation={orientation}
    className={cn(
      'flex touch-none select-none transition-colors',
      orientation === 'vertical' &&
        'h-full w-2.5 border-l border-l-transparent p-[1px]',
      orientation === 'horizontal' &&
        'h-2.5 flex-col border-t border-t-transparent p-[1px]',
      className,
    )}
    {...props}
  >
    <ScrollAreaPrimitive.ScrollAreaThumb className="relative flex-1 rounded-full bg-border" />
  </ScrollAreaPrimitive.ScrollAreaScrollbar>
));
ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName;

export { ScrollArea, ScrollBar };
