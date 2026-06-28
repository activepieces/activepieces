'use client';

import { useVirtualizer } from '@tanstack/react-virtual';
import * as React from 'react';

import { cn } from '@/lib/utils';

// Renders rows through @tanstack/react-virtual so only the rows inside the
// scroll viewport are mounted. Small lists fall back to a plain render so they
// keep their original inline layout (no nested scrollbar, native expand/collapse
// animations) — virtualization only kicks in once a list is large enough that
// mounting every row would jank the UI.
function VirtualizedList<T>({
  items,
  renderItem,
  estimateSize = 36,
  overscan = 12,
  getItemKey,
  virtualizeThreshold = DEFAULT_VIRTUALIZE_THRESHOLD,
  className,
}: VirtualizedListProps<T>) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const shouldVirtualize = items.length > virtualizeThreshold;

  const rowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => estimateSize,
    overscan,
    getItemKey,
    // Seed a non-zero viewport so the first paint renders a window of rows even
    // before the ResizeObserver reports the real height. Without this, a list
    // mounted inside a still-animating container (e.g. a Collapsible opening for
    // the first time) measures as 0px tall and flashes blank until the next
    // frame. The ResizeObserver corrects this to the real height immediately.
    initialRect: { width: 0, height: INITIAL_VIEWPORT_HEIGHT },
  });

  if (!shouldVirtualize) {
    return (
      <>
        {items.map((item, index) => (
          <React.Fragment key={getItemKey ? getItemKey(index) : index}>
            {renderItem(item, index)}
          </React.Fragment>
        ))}
      </>
    );
  }

  const virtualItems = rowVirtualizer.getVirtualItems();

  return (
    <div ref={scrollRef} className={cn('overflow-y-auto', className)}>
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualItems.map((virtualItem) => (
          <div
            key={virtualItem.key}
            data-index={virtualItem.index}
            ref={rowVirtualizer.measureElement}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            {renderItem(items[virtualItem.index], virtualItem.index)}
          </div>
        ))}
      </div>
    </div>
  );
}

export { VirtualizedList };

const DEFAULT_VIRTUALIZE_THRESHOLD = 100;
const INITIAL_VIEWPORT_HEIGHT = 600;

type VirtualizedListProps<T> = {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  estimateSize?: number;
  overscan?: number;
  getItemKey?: (index: number) => string | number;
  virtualizeThreshold?: number;
  // Applied to the scroll container in the virtualized path only (it caps the
  // viewport height, e.g. `max-h-[60vh]`). Lists at or below the threshold
  // render inline as a fragment, matching their pre-virtualization layout, so
  // the height cap intentionally does not apply to them.
  className?: string;
};
