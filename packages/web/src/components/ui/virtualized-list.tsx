'use client';

import { useVirtualizer } from '@tanstack/react-virtual';
import * as React from 'react';

// Renders rows through @tanstack/react-virtual so only the rows inside the
// scroll viewport are mounted. It virtualizes against the nearest scrollable
// ancestor (the surrounding panel / data-selector ScrollArea) rather than
// creating its own bounded scroll box, so there is a single, fully-visible
// scrollbar that reaches the end of the list — a nested scroll container gets
// clipped when it is taller than the visible area, leaving the last rows
// unreachable by the scrollbar. Small lists fall back to a plain render so they
// keep their original inline layout; virtualization only kicks in once a list
// is large enough that mounting every row would jank the UI.
function VirtualizedList<T>({
  items,
  renderItem,
  estimateSize = 36,
  overscan = 12,
  getItemKey,
  virtualizeThreshold = DEFAULT_VIRTUALIZE_THRESHOLD,
}: VirtualizedListProps<T>) {
  const sizerRef = React.useRef<HTMLDivElement>(null);
  const [scrollElement, setScrollElement] = React.useState<HTMLElement | null>(
    null,
  );
  const [scrollMargin, setScrollMargin] = React.useState(0);
  const shouldVirtualize = items.length > virtualizeThreshold;

  React.useLayoutEffect(() => {
    if (!shouldVirtualize) {
      setScrollElement(null);
      return;
    }
    setScrollElement(findScrollParent(sizerRef.current));
  }, [shouldVirtualize]);

  React.useLayoutEffect(() => {
    const sizer = sizerRef.current;
    if (!shouldVirtualize || !scrollElement || !sizer) {
      return;
    }
    const measure = () => {
      // Offset of the list's start within the scroll element's content. It is
      // invariant under scrolling (the two rect tops move with scrollTop), so it
      // only needs recomputing when content above the list changes size.
      const offset =
        sizer.getBoundingClientRect().top -
        scrollElement.getBoundingClientRect().top +
        scrollElement.scrollTop;
      setScrollMargin(Math.max(0, Math.round(offset)));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(scrollElement);
    if (sizer.parentElement) {
      observer.observe(sizer.parentElement);
    }
    return () => observer.disconnect();
  }, [shouldVirtualize, scrollElement, items.length]);

  const rowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => scrollElement,
    estimateSize: () => estimateSize,
    overscan,
    getItemKey,
    scrollMargin,
    // Seed a non-zero viewport so the first paint (before the scroll element is
    // resolved / measured) renders a window of rows instead of flashing blank.
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
    <div
      ref={sizerRef}
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
            transform: `translateY(${virtualItem.start - scrollMargin}px)`,
          }}
        >
          {renderItem(items[virtualItem.index], virtualItem.index)}
        </div>
      ))}
    </div>
  );
}

export { VirtualizedList };

function findScrollParent(node: HTMLElement | null): HTMLElement | null {
  let element = node?.parentElement ?? null;
  while (element) {
    // The Radix ScrollArea viewport sets its `overflow` only after it measures
    // its content, so on the first layout tick its computed overflow is not yet
    // scrollable — match it by its data-slot so it is found immediately. Plain
    // overflow containers (e.g. the test step panel) are matched by overflow.
    const overflowY = getComputedStyle(element).overflowY;
    if (
      element.dataset.slot === 'scroll-area-viewport' ||
      overflowY === 'auto' ||
      overflowY === 'scroll'
    ) {
      return element;
    }
    element = element.parentElement;
  }
  return null;
}

const DEFAULT_VIRTUALIZE_THRESHOLD = 100;
const INITIAL_VIEWPORT_HEIGHT = 600;

type VirtualizedListProps<T> = {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  estimateSize?: number;
  overscan?: number;
  getItemKey?: (index: number) => string | number;
  virtualizeThreshold?: number;
};
