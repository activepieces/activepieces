import { ScrollArea as ScrollAreaPrimitive } from 'radix-ui';
import * as React from 'react';

import { cn } from '@/lib/utils';

function ScrollArea({
  className,
  children,
  viewPortClassName,
  viewPortRef,
  orientation = 'vertical',
  showGradient = false,
  gradientClassName,
  ...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.Root> &
  ScrollAreaCustomProps) {
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
      data-slot="scroll-area"
      className={cn('relative overflow-hidden', className)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport
        data-slot="scroll-area-viewport"
        className={cn(
          'size-full rounded-[inherit] [&>div]:block!',
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
            'pointer-events-none absolute bottom-0 left-0 right-0 h-1/5 bg-linear-to-t from-sidebar to-transparent',
            gradientClassName,
          )}
        />
      )}
    </ScrollAreaPrimitive.Root>
  );
}

function ScrollBar({
  className,
  orientation = 'vertical',
  ...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>) {
  return (
    <ScrollAreaPrimitive.ScrollAreaScrollbar
      data-slot="scroll-area-scrollbar"
      orientation={orientation}
      className={cn(
        'flex touch-none transition-colors select-none',
        orientation === 'vertical' && 'h-full w-1.5',
        orientation === 'horizontal' && 'h-1.5 flex-col',
        className,
      )}
      {...props}
    >
      <ScrollAreaPrimitive.ScrollAreaThumb
        data-slot="scroll-area-thumb"
        className="relative flex-1 rounded-full bg-border hover:bg-ring transition-colors"
      />
    </ScrollAreaPrimitive.ScrollAreaScrollbar>
  );
}

export { ScrollArea, ScrollBar };

type ScrollAreaCustomProps = {
  viewPortClassName?: string;
  orientation?: 'vertical' | 'horizontal';
  viewPortRef?: React.RefObject<HTMLDivElement | null>;
  showGradient?: boolean;
  gradientClassName?: string;
};
