import { Query, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';

import { Skeleton } from '@/components/ui/skeleton';
import { useChatPanel } from '@/features/workspace/lib/chat-panel-open';
import { pageColumnUtils } from '@/lib/page-column-utils';
import { cn } from '@/lib/utils';

import { useCardWidth, useChatWidth, useDockWidth } from './chat-window';

export function ChatContentColumn({ children }: { children: React.ReactNode }) {
  const chatWidth = useChatWidth();
  const moving = useChatPanel((s) => s.moving);
  const mode = useChatPanel((s) => s.mode);
  const cardWidth = useCardWidth();
  const dockWidth = useDockWidth();
  const full = chatWidth === 'full';
  const docked = chatWidth === 'left' || chatWidth === 'right';
  const pageRef = useRef<HTMLDivElement>(null);
  const cover = usePageCover({ pageRef, moving });
  // While the chat moves, the page sits at the width it lands at, so it lays
  // out once instead of on every frame.
  const pinnedWidth =
    moving === 'enter' && docked
      ? cardWidth - dockWidth
      : moving === 'exit'
      ? 0
      : null;
  return (
    <div
      id={pageColumnUtils.ID}
      inert={full}
      className={cn(
        'flex min-w-0 flex-col overflow-hidden',
        pinnedWidth === null
          ? 'relative flex-1'
          : ['absolute inset-y-0', mode === 'right' ? 'left-0' : 'right-0'],
      )}
      style={pinnedWidth === null ? undefined : { width: pinnedWidth }}
    >
      <div ref={pageRef} className="contents">
        {children}
      </div>
      {cover !== 'off' && <PageSkeleton fading={cover === 'fading'} />}
    </div>
  );
}

// Covers the page from the moment the chat starts shrinking into the dock
// until the page beside it has real content, so it never flashes blank.
function usePageCover({
  pageRef,
  moving,
}: {
  pageRef: React.RefObject<HTMLDivElement | null>;
  moving: 'enter' | 'exit' | null;
}): PageCover {
  const [cover, setCover] = useState<PageCover>('off');
  const queryClient = useQueryClient();

  if (moving === 'enter' && cover !== 'on') {
    setCover('on');
  }

  useEffect(() => {
    if (cover === 'fading') {
      const timer = setTimeout(() => setCover('off'), COVER_FADE_MS);
      return () => clearTimeout(timer);
    }
    if (cover !== 'on' || moving !== null) return;
    const page = pageRef.current;
    if (!page) return;
    const loading = () =>
      queryClient
        .getQueryCache()
        .findAll({ predicate: isFirstLoad })
        .some((query) => query.state.fetchStatus === 'fetching');
    const check = () => {
      if (!loading() && fillsPage(page)) setCover('fading');
    };
    const observer = new MutationObserver(check);
    observer.observe(page, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    const unsubscribe = queryClient.getQueryCache().subscribe(check);
    const giveUp = setTimeout(() => setCover('fading'), COVER_MAX_MS);
    check();
    return () => {
      observer.disconnect();
      unsubscribe();
      clearTimeout(giveUp);
    };
  }, [cover, moving, pageRef, queryClient]);

  return cover;
}

function isFirstLoad(query: Query): boolean {
  return query.state.data === undefined;
}

function fillsPage(page: HTMLElement): boolean {
  const column = page.parentElement?.getBoundingClientRect();
  if (!column || column.height === 0) return false;
  const reach = column.top + column.height * COVER_REACH;
  const walker = document.createTreeWalker(page, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const parent = node.parentElement;
    if (!parent || (node.textContent ?? '').trim() === '') continue;
    const rect = parent.getBoundingClientRect();
    if (
      rect.bottom >= reach &&
      rect.top <= column.bottom &&
      parent.checkVisibility({
        opacityProperty: true,
        visibilityProperty: true,
      })
    ) {
      return true;
    }
  }
  return false;
}

export function PageSkeleton({ fading = false }: { fading?: boolean }) {
  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none absolute inset-0 z-20 flex flex-col gap-4 bg-gray-1 p-6 transition-opacity duration-150 ease-move motion-reduce:transition-none',
        fading && 'opacity-0',
      )}
    >
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-8 w-full" />
      {SKELETON_ROWS.map((width) => (
        <Skeleton key={width} className="h-5" style={{ width }} />
      ))}
    </div>
  );
}

type PageCover = 'off' | 'on' | 'fading';

const SKELETON_ROWS = ['92%', '84%', '88%', '76%', '90%', '70%'];
const COVER_MAX_MS = 600;
const COVER_FADE_MS = 150;
const COVER_REACH = 0.35;
