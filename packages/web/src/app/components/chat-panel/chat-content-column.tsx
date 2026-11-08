import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { Skeleton } from '@/components/ui/skeleton';
import { chatLayoutUtils } from '@/features/workspace/lib/chat-layout';
import { useChatPanel } from '@/features/workspace/lib/chat-panel-open';
import { useRailOpen } from '@/features/workspace/lib/rail-collapsed';
import { windowSizeHooks } from '@/features/workspace/lib/window-size-hooks';
import { cn } from '@/lib/utils';

import { useChatWidth } from './chat-window';
import { FollowBar } from './follow-bar';

export function ChatContentColumn({ children }: { children: React.ReactNode }) {
  const chatWidth = useChatWidth();
  const moving = useChatPanel((s) => s.moving);
  const savedWidth = useChatPanel((s) => s.dockWidth);
  const railOpen = useRailOpen();
  const viewportWidth = windowSizeHooks.useWidth();
  const full = chatWidth === 'full';
  const split = useChatPanel((s) => s.split) && !full;
  const pageRef = useRef<HTMLDivElement>(null);
  const blank = useBlankPage({ pageRef, watch: split });
  const cardWidth = chatLayoutUtils.cardInnerWidth({ viewportWidth, railOpen });
  const pinnedWidth =
    moving === 'enter' && chatWidth === 'left'
      ? cardWidth - chatLayoutUtils.dockWidthFor({ savedWidth, cardWidth })
      : moving === 'exit'
      ? 0
      : null;
  return (
    <div
      inert={full}
      className={cn(
        'min-w-0 overflow-hidden',
        pinnedWidth === null ? 'relative flex-1' : 'absolute inset-y-0 right-0',
      )}
      style={pinnedWidth === null ? undefined : { width: pinnedWidth }}
    >
      <div className="flex h-full flex-col">
        <FollowBar />
        <div ref={pageRef} className="contents">
          {children}
        </div>
      </div>
      {blank && <PageSkeleton />}
    </div>
  );
}

function useBlankPage({
  pageRef,
  watch,
}: {
  pageRef: React.RefObject<HTMLDivElement | null>;
  watch: boolean;
}): boolean {
  const [blank, setBlank] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => {
    const page = pageRef.current;
    if (!watch || !page) {
      setBlank(false);
      return;
    }
    const observer = new MutationObserver(() => check());
    const check = () => {
      const empty = isBlank(page);
      setBlank(empty);
      if (!empty) observer.disconnect();
    };
    observer.observe(page, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    check();
    return () => observer.disconnect();
  }, [pageRef, watch, pathname]);
  return blank;
}

function isBlank(page: HTMLElement): boolean {
  return (
    (page.textContent ?? '').trim() === '' &&
    page.querySelector('img, svg, canvas, input, table') === null
  );
}

function PageSkeleton() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 flex flex-col gap-4 bg-gray-1 p-6"
    >
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-8 w-full" />
      {SKELETON_ROWS.map((width) => (
        <Skeleton key={width} className="h-5" style={{ width }} />
      ))}
    </div>
  );
}

const SKELETON_ROWS = ['92%', '84%', '88%', '76%', '90%', '70%'];
