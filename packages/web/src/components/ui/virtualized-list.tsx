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

type VirtualizedListProps<T> = {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  estimateSize?: number;
  overscan?: number;
  getItemKey?: (index: number) => string | number;
  virtualizeThreshold?: number;
  className?: string;
};
