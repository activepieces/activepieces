import { RefObject, useEffect, useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';

export const useElementSize = (ref: RefObject<HTMLElement>) => {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const debouncedSetSize = useDebouncedCallback(setSize, 150);
  useEffect(() => {
    const handleResize = (entries: ResizeObserverEntry[]) => {
      if (entries[0]) {
        const { width, height } = entries[0].contentRect;
        debouncedSetSize({ width, height });
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);

    if (ref.current) {
      resizeObserver.observe(ref.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [debouncedSetSize, ref]);

  return size;
};
