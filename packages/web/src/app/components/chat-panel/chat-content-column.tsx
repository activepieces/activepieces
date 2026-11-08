import { Query, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { Skeleton } from '@/components/ui/skeleton';
import { chatLayoutUtils } from '@/features/workspace/lib/chat-layout';
import { useChatPanel } from '@/features/workspace/lib/chat-panel-open';
import { useRailOpen } from '@/features/workspace/lib/rail-collapsed';
import { windowSizeHooks } from '@/features/workspace/lib/window-size-hooks';
import { pageColumnUtils } from '@/lib/page-column-utils';
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
  const columnRef = useRef<HTMLDivElement>(null);
  const narrow = useNarrowColumn(columnRef);
  const blank = useBlankPage({ pageRef, watch: split });
  const cover = usePageCover({ pageRef, entering: moving === 'enter' });
  const cardWidth = chatLayoutUtils.cardInnerWidth({ viewportWidth, railOpen });
  const pinnedWidth =
    moving === 'enter' && chatWidth === 'left'
      ? cardWidth - chatLayoutUtils.dockWidthFor({ savedWidth, cardWidth })
      : moving === 'exit'
      ? 0
      : null;
  return (
    <div
      ref={columnRef}
      id={pageColumnUtils.ID}
      inert={full}
      className={cn(
        'min-w-0 overflow-hidden',
        pinnedWidth === null ? 'relative flex-1' : 'absolute inset-y-0 right-0',
      )}
      style={pinnedWidth === null ? undefined : { width: pinnedWidth }}
    >
      <div className="flex h-full flex-col">
        <FollowBar inFlow={narrow} />
        <div ref={pageRef} className="contents">
          {children}
        </div>
      </div>
      {(blank || cover !== 'off') && (
        <PageSkeleton fading={!blank && cover === 'fading'} />
      )}
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

function useNarrowColumn(
  columnRef: React.RefObject<HTMLDivElement | null>,
): boolean {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const column = columnRef.current;
    if (!column) return;
    const observer = new ResizeObserver(() =>
      setNarrow(column.clientWidth < NARROW_COLUMN_WIDTH),
    );
    observer.observe(column);
    return () => observer.disconnect();
  }, [columnRef]);
  return narrow;
}

function usePageCover({
  pageRef,
  entering,
}: {
  pageRef: React.RefObject<HTMLDivElement | null>;
  entering: boolean;
}): PageCover {
  const [cover, setCover] = useState<PageCover>('off');
  const queryClient = useQueryClient();
  useEffect(() => {
    if (!entering) return;
    setCover('on');
  }, [entering]);
  useEffect(() => {
    if (cover === 'fading') {
      const timer = setTimeout(() => setCover('off'), COVER_FADE_MS);
      return () => clearTimeout(timer);
    }
    if (cover !== 'on') return;
    let frame = 0;
    let settledAt: number | null = null;
    const loading = () =>
      queryClient
        .getQueryCache()
        .findAll({ predicate: isFirstLoad })
        .some((query) => query.state.fetchStatus === 'fetching');
    const check = () => {
      const now = performance.now();
      if (useChatPanel.getState().moving !== null) {
        settledAt = null;
      } else {
        settledAt = settledAt ?? now;
        const page = pageRef.current;
        const ready = page !== null && !loading() && fillsPage(page);
        if (ready || now - settledAt >= COVER_MAX_MS) {
          setCover('fading');
          return;
        }
      }
      frame = requestAnimationFrame(check);
    };
    frame = requestAnimationFrame(check);
    return () => cancelAnimationFrame(frame);
  }, [cover, pageRef, queryClient]);
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

function isBlank(page: HTMLElement): boolean {
  return (
    (page.textContent ?? '').trim() === '' &&
    page.querySelector('img, svg, canvas, input, table') === null
  );
}

function PageSkeleton({ fading = false }: { fading?: boolean }) {
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
const NARROW_COLUMN_WIDTH = 640;
