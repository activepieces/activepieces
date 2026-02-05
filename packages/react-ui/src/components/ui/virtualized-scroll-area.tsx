'use client';

import { useVirtualizer } from '@tanstack/react-virtual';
import * as React from 'react';

import { cn } from '@/lib/utils';
import { isNil } from '@activepieces/shared';

import { ScrollArea } from './scroll-area';

interface VirtualizedScrollAreaProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
  estimateSize: (index: number) => number;
  getItemKey?: (index: number) => string | number;
  className?: string;
  initialScroll?: {
    index: number;
    clickAfterScroll: boolean;
  };
}

export interface VirtualizedScrollAreaRef {
  scrollToIndex: (
    index: number,
    options?: {
      align?: 'start' | 'center' | 'end';
      behavior?: 'auto' | 'smooth';
    },
  ) => void;
}

const VirtualizedScrollArea = <T,>({
  items,
  renderItem,
  overscan = 5,
  estimateSize,
  getItemKey,
  initialScroll,
  className,
  ...props
}: VirtualizedScrollAreaProps<T>) => {
  const scrollAreaViewportRef = React.useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => scrollAreaViewportRef.current,
    estimateSize: estimateSize,
    overscan,
    getItemKey: getItemKey || ((index) => index),
  });

  const virtualItems = rowVirtualizer.getVirtualItems();
  React.useEffect(() => {
    if (isNil(initialScroll)) {
      return;
    }
    if (initialScroll.index > -1) {
      rowVirtualizer.scrollToIndex(initialScroll.index, {
        align: 'start',
        behavior: 'auto',
      });
      if (initialScroll?.clickAfterScroll) {
        //need to wait for the scroll to be completed
        setTimeout(() => {
          const targetElement = scrollAreaViewportRef.current?.querySelector(
            `[data-virtual-index="${initialScroll.index}"]`,
          );
          const renderedElement = targetElement?.children[0];
          if (renderedElement instanceof HTMLElement) {
            renderedElement.click();
          }
        }, 100);
      }
    }
  }, [rowVirtualizer]);
  return (
    <ScrollArea
      viewPortRef={scrollAreaViewportRef}
      {...props}
      className={cn('h-full', className)}
    >
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
            data-virtual-index={virtualItem.index}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            {renderItem(items[virtualItem.index], virtualItem.index)}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};

VirtualizedScrollArea.displayName = 'VirtualizedScrollArea';

export { VirtualizedScrollArea };
