import { t } from 'i18next';
import {
  Suspense,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { useLocation, useMatches, useNavigate } from 'react-router-dom';

import { chatScrollAnchor } from '@/features/chat/lib/chat-scroll-anchor';
import {
  ChatWidth,
  chatLayoutUtils,
} from '@/features/workspace/lib/chat-layout';
import {
  chatPanelUtils,
  useChatPanel,
} from '@/features/workspace/lib/chat-panel-open';
import { useRailOpen } from '@/features/workspace/lib/rail-collapsed';
import { windowSizeHooks } from '@/features/workspace/lib/window-size-hooks';
import { lazyWithRetry } from '@/lib/lazy-with-retry';
import { cn } from '@/lib/utils';

import { useShellHandle } from '../app-shell';

const loadChatChrome = () =>
  import('./chat-chrome').then((m) => ({ default: m.ChatChrome }));
const ChatChrome = lazyWithRetry(loadChatChrome, 'chat-chrome');

// The card width the page will have once the rail has settled, so the dock
// and the page can be sized for where they land, not where they are mid-move.
export function useCardWidth(): number {
  const railOpen = useRailOpen();
  const viewportWidth = windowSizeHooks.useViewportWidth();
  const builder = useShellHandle().shell === 'builder';
  return chatLayoutUtils.cardInnerWidth({
    viewportWidth,
    railOpen,
    chrome: builder ? BUILDER_CARD_CHROME : undefined,
  });
}

export function useDockWidth(dragWidth: number | null = null): number {
  const savedWidth = useChatPanel((s) => s.dockWidth);
  const cardWidth = useCardWidth();
  return chatLayoutUtils.shownDockWidth({
    savedWidth: dragWidth ?? savedWidth,
    cardWidth,
  });
}

export function useChatWidth(): ChatWidth {
  const fullPage = useShellHandle().chat === 'full';
  const docked = useChatPanel((s) => s.open);
  const mode = useChatPanel((s) => s.mode);
  const phone = windowSizeHooks.useIsPhone();
  // Phones keep the dock closed until the phone sheet lands.
  return chatLayoutUtils.widthFor({
    fullPage,
    open: phone ? false : docked,
    mode,
  });
}

export function useActiveConversationId(): string | null {
  const fullPage = useShellHandle().chat === 'full';
  const urlId =
    useMatches().findLast((m) => m.params.conversationId !== undefined)?.params
      .conversationId ?? null;
  const storeId = useChatPanel((s) => s.conversationId);
  return fullPage ? urlId : storeId;
}

export function ChatPanel() {
  const chatWidth = useChatWidth();
  const mode = useChatPanel((s) => s.mode);
  const moving = useChatPanel((s) => s.moving);
  const [dragWidth, setDragWidth] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const full = chatWidth === 'full';
  const visible = chatWidth !== 'closed';
  const side = full ? 'left' : mode;
  const width = useDockWidth(dragWidth);
  const cardWidth = useCardWidth();
  const innerWide = full && moving !== 'exit';
  const layoutKey = `${chatWidth}|${innerWide}`;
  const committedLayout = useRef(layoutKey);
  const contentRef = useRef<HTMLDivElement>(null);

  // Read where the reader is before React swaps the width under them.
  if (committedLayout.current !== layoutKey && pendingCapture !== layoutKey) {
    pendingCapture = layoutKey;
    chatScrollAnchor.capture();
  }

  useLayoutEffect(() => {
    const from = committedLayout.current;
    if (from === layoutKey) return;
    committedLayout.current = layoutKey;
    pendingCapture = null;
    chatScrollAnchor.restore();
    if (from.endsWith('|false') && innerWide) {
      contentRef.current?.animate([{ opacity: 0 }, { opacity: 1 }], {
        duration: DIP_MS,
        easing: 'ease-out',
      });
    }
  }, [layoutKey, innerWide]);

  if (visible && !mounted) {
    setMounted(true);
  }

  useEffect(() => {
    if (mounted) return;
    const prewarm = setTimeout(() => setMounted(true), PREWARM_MS);
    return () => clearTimeout(prewarm);
  }, [mounted]);

  useEffect(() => {
    useChatPanel.getState().setPanelMounted(true);
    return () => useChatPanel.getState().setPanelMounted(false);
  }, []);

  useComposerFocus({ panelRef, visible });

  const widthAt = (event: React.PointerEvent<HTMLDivElement>) => {
    const card = panelRef.current?.parentElement?.getBoundingClientRect();
    if (!card) return width;
    return chatLayoutUtils.shownDockWidth({
      savedWidth:
        side === 'left'
          ? event.clientX - card.left
          : card.right - event.clientX,
      cardWidth,
    });
  };

  const resizeByKey = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    const step = event.shiftKey ? 48 : 16;
    const grows = (event.key === 'ArrowRight') === (side === 'left');
    useChatPanel.getState().setDockWidth(
      chatLayoutUtils.shownDockWidth({
        savedWidth: width + (grows ? step : -step),
        cardWidth,
      }),
    );
  };

  return (
    <aside
      ref={panelRef}
      id={chatLayoutUtils.PANEL_ID}
      aria-label={t('Chat')}
      inert={!visible}
      onTransitionEnd={(event) => {
        if (
          event.target === event.currentTarget &&
          event.propertyName === 'width'
        ) {
          useChatPanel.getState().setMoving(null);
        }
      }}
      style={{
        width: full ? '100%' : visible ? width : 0,
        transition: moving ? MOVE_TRANSITION[moving] : undefined,
      }}
      className={cn(
        'relative flex shrink-0 flex-col overflow-hidden bg-gray-1',
        side === 'right' && 'order-last',
        moving === 'enter' && 'z-[1]',
        visible && !full && (side === 'left' ? 'border-r' : 'border-l'),
        dragWidth === null &&
          'transition-[width] duration-[var(--ap-move,200ms)] ease-move motion-reduce:transition-none',
      )}
    >
      <ChatRouterBinding />
      <div
        ref={contentRef}
        style={{ width: innerWide ? '100%' : `${width}px` }}
        className={cn(
          'absolute inset-y-0 flex flex-col',
          side === 'left' ? 'left-0' : 'right-0',
        )}
      >
        {mounted && (
          <Suspense fallback={null}>
            <ChatChrome />
          </Suspense>
        )}
      </div>
      {visible && !full && (
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label={t('Resize chat')}
          aria-valuemin={chatLayoutUtils.DOCK_MIN_WIDTH}
          aria-valuemax={chatLayoutUtils.DOCK_MAX_WIDTH}
          aria-valuenow={width}
          tabIndex={0}
          onPointerDown={(event) => {
            if (event.button !== 0) return;
            event.preventDefault();
            event.currentTarget.setPointerCapture(event.pointerId);
            setDragWidth(width);
          }}
          onPointerMove={(event) => {
            if (event.currentTarget.hasPointerCapture(event.pointerId)) {
              setDragWidth(widthAt(event));
            }
          }}
          onPointerUp={(event) => {
            if (!event.currentTarget.hasPointerCapture(event.pointerId))
              return;
            useChatPanel.getState().setDockWidth(widthAt(event));
            setDragWidth(null);
          }}
          onLostPointerCapture={() => setDragWidth(null)}
          onKeyDown={resizeByKey}
          onDoubleClick={() =>
            useChatPanel
              .getState()
              .setDockWidth(chatLayoutUtils.DOCK_DEFAULT_WIDTH)
          }
          className={cn(
            'group/edge absolute inset-y-0 z-10 w-2 cursor-col-resize touch-none select-none focus-visible:outline-none',
            side === 'left' ? 'right-0' : 'left-0',
          )}
        >
          <span
            className={cn(
              'absolute inset-y-0 w-0.5 bg-gray-8 transition-opacity duration-150 group-hover/edge:opacity-100 group-focus-visible/edge:opacity-100',
              side === 'left' ? 'right-0' : 'left-0',
              dragWidth === null ? 'opacity-0' : 'opacity-100',
            )}
          />
        </div>
      )}
    </aside>
  );
}

function ChatRouterBinding() {
  const navigate = useNavigate();
  const location = useLocation();
  const fullPage = useShellHandle().chat === 'full';
  const latest = useRef({ location, fullPage });
  latest.current = { location, fullPage };

  useEffect(
    () =>
      chatPanelUtils.bindRouter({
        navigate: (target) => {
          if ('back' in target) {
            navigate(-1);
            return;
          }
          navigate(target.to, { replace: target.replace, state: target.state });
        },
        location: () => latest.current.location,
        isFullPage: () => latest.current.fullPage,
      }),
    [navigate],
  );

  return null;
}

function useComposerFocus({
  panelRef,
  visible,
}: {
  panelRef: React.RefObject<HTMLDivElement | null>;
  visible: boolean;
}) {
  const wasVisible = useRef(visible);
  const returnTo = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (visible === wasVisible.current) return;
    wasVisible.current = visible;
    const panel = panelRef.current;
    if (visible) {
      const active = document.activeElement;
      returnTo.current =
        active instanceof HTMLElement && active !== document.body
          ? active
          : null;
      return panel ? focusComposerWhenReady(panel) : undefined;
    }
    const active = document.activeElement;
    const focusLeftWithPanel =
      !active || active === document.body || panel?.contains(active);
    if (focusLeftWithPanel && returnTo.current?.isConnected) {
      returnTo.current.focus({ preventScroll: true });
    }
    returnTo.current = null;
  }, [visible, panelRef]);
}

// Focus the composer as soon as it exists. On a cold first open the chat is
// still loading, so wait for the textarea to appear, unless the user goes
// somewhere else first.
function focusComposerWhenReady(panel: HTMLElement): (() => void) | undefined {
  const focus = () => {
    const input = panel.querySelector('textarea');
    if (!input) return false;
    input.focus({ preventScroll: true });
    return true;
  };
  if (focus()) return undefined;
  const observer = new MutationObserver(() => {
    if (focus()) stop();
  });
  const onElsewhere = (event: Event) => {
    if (!(event.target instanceof Node) || !panel.contains(event.target)) {
      stop();
    }
  };
  const stop = () => {
    observer.disconnect();
    clearTimeout(timer);
    HANDOFF_STOP_EVENTS.forEach((name) =>
      document.removeEventListener(name, onElsewhere, true),
    );
  };
  observer.observe(panel, { childList: true, subtree: true });
  HANDOFF_STOP_EVENTS.forEach((name) =>
    document.addEventListener(name, onElsewhere, true),
  );
  const timer = setTimeout(stop, HANDOFF_MAX_MS);
  return stop;
}

const HANDOFF_STOP_EVENTS = ['focusin', 'pointerdown', 'keydown'] as const;
const HANDOFF_MAX_MS = 5000;
const PREWARM_MS = 800;
const DIP_MS = 120;
const BUILDER_CARD_CHROME = 14;
const { MOVE_MS, MOVE_EASE } = chatLayoutUtils;
const MOVE_TRANSITION: Record<'enter' | 'exit', string> = {
  enter: `width ${MOVE_MS.wide}ms ${MOVE_EASE.emphasized} ${MOVE_MS.edgeDelay}ms`,
  exit: `width ${MOVE_MS.back}ms ${MOVE_EASE.standard}`,
};
let pendingCapture: string | null = null;
