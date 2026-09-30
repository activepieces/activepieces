import { useVirtualizer } from '@tanstack/react-virtual';
import * as React from 'react';

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
