import {
  HTMLAttributes,
  ReactNode,
  Ref,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import { cn } from '@/lib/utils';

export function ChatScrollFade({
  axis,
  className,
  children,
  scrollRef,
  ...rest
}: ChatScrollFadeProps) {
  const nodeRef = useRef<HTMLDivElement | null>(null);
  const [hasMore, setHasMore] = useState(false);

  const measure = useCallback(() => {
    const node = nodeRef.current;
    if (!node) return;
    const remaining =
      axis === 'x'
        ? node.scrollWidth - node.clientWidth - node.scrollLeft
        : node.scrollHeight - node.clientHeight - node.scrollTop;
    setHasMore(remaining > 1);
  }, [axis]);

  useEffect(() => {
    const node = nodeRef.current;
    if (!node) return;
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    Array.from(node.children).forEach((child) => observer.observe(child));
    return () => observer.disconnect();
  }, [measure, children]);

  const setRefs = (node: HTMLDivElement | null) => {
    nodeRef.current = node;
    if (typeof scrollRef === 'function') scrollRef(node);
    else if (scrollRef) scrollRef.current = node;
  };

  return (
    <div
      {...rest}
      ref={setRefs}
      onScroll={measure}
      className={cn(
        axis === 'x' ? 'overflow-x-auto' : 'overflow-y-auto',
        hasMore && FADE_CLASS[axis],
        className,
      )}
    >
      {children}
    </div>
  );
}

const FADE_CLASS: Record<ChatScrollFadeAxis, string> = {
  x: '[mask-image:linear-gradient(to_right,black_calc(100%-40px),transparent)]',
  y: '[mask-image:linear-gradient(to_bottom,black_calc(100%-28px),transparent)]',
};

type ChatScrollFadeAxis = 'x' | 'y';

type ChatScrollFadeProps = Omit<HTMLAttributes<HTMLDivElement>, 'onScroll'> & {
  axis: ChatScrollFadeAxis;
  scrollRef?: Ref<HTMLDivElement>;
  children: ReactNode;
};
