import { isObject } from '@activepieces/core-utils';
import { t } from 'i18next';
import {
  Suspense,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import { useLocation, useMatches, useNavigate } from 'react-router-dom';

import { ChatSparkIcon } from '@/components/icons/chat-spark';
import { Button } from '@/components/ui/button';
import {
  ChatWidth,
  chatLayoutUtils,
} from '@/features/workspace/lib/chat-layout';
import {
  chatPanelUtils,
  useChatPanel,
} from '@/features/workspace/lib/chat-panel-open';
import { windowSizeHooks } from '@/features/workspace/lib/window-size-hooks';
import { lazyWithRetry } from '@/lib/lazy-with-retry';
import { CHAT_ROUTE } from '@/lib/route-utils';
import { cn } from '@/lib/utils';

import { useShellHandle } from '../app-shell';

const ChatChrome = lazyWithRetry(
  () => import('./chat-chrome').then((m) => ({ default: m.ChatChrome })),
  'chat-chrome',
);

export function useChatWidth(): ChatWidth {
  const fullPage = useShellHandle().chat === 'full';
  const open = useChatPanel((s) => s.open);
  const mode = useChatPanel((s) => s.mode);
  return useSyncExternalStore(windowSizeHooks.subscribe, () =>
    chatLayoutUtils.widthFor({
      fullPage,
      open,
      mode,
      viewportWidth: window.innerWidth,
    }),
  );
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
  const savedWidth = useChatPanel((s) => s.dockWidth);
  const [dragWidth, setDragWidth] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const full = chatWidth === 'full';
  const visible = chatWidth !== 'closed';
  const side = full ? 'left' : mode;
  const width = dragWidth ?? savedWidth;

  if (visible && !mounted) {
    setMounted(true);
  }

  useEffect(() => {
    useChatPanel.getState().setPanelMounted(true);
    return () => useChatPanel.getState().setPanelMounted(false);
  }, []);

  useComposerFocus({ panelRef, visible });

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (
        !(event.metaKey || event.ctrlKey) ||
        !event.shiftKey ||
        event.altKey ||
        event.key.toLowerCase() !== 'o'
      ) {
        return;
      }
      event.preventDefault();
      chatPanelUtils.startNewChat();
      panelRef.current?.querySelector('textarea')?.focus();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const widthAt = (event: React.PointerEvent<HTMLDivElement>) => {
    const card = panelRef.current?.parentElement?.getBoundingClientRect();
    if (!card) return width;
    return chatLayoutUtils.dockWidthFor(
      side === 'left' ? event.clientX - card.left : card.right - event.clientX,
    );
  };

  const resizeByKey = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    const step = event.shiftKey ? 48 : 16;
    const grows = (event.key === 'ArrowRight') === (side === 'left');
    useChatPanel
      .getState()
      .setDockWidth(
        chatLayoutUtils.dockWidthFor(width + (grows ? step : -step)),
      );
  };

  return (
    <aside
      ref={panelRef}
      aria-label={t('Chat')}
      inert={!visible}
      style={
        full
          ? { width: '100%' }
          : {
              width: visible ? width : 0,
              maxWidth: visible ? DOCK_MAX_CSS : undefined,
            }
      }
      className={cn(
        'relative flex shrink-0 flex-col overflow-hidden bg-gray-1',
        side === 'right' && 'order-last',
        visible && !full && (side === 'left' ? 'border-r' : 'border-l'),
        !full && 'max-md:hidden',
        dragWidth === null &&
          'transition-[width] duration-150 ease-move motion-reduce:transition-none',
      )}
    >
      <ChatRouterBinding />
      <ChatLastPageTracker />
      {full && <ChatUrlSync />}
      {mounted && (
        <Suspense fallback={null}>
          <ChatChrome />
        </Suspense>
      )}
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
            if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
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

export function ChatLauncher() {
  const chatWidth = useChatWidth();
  const mode = useChatPanel((s) => s.mode);
  if (chatWidth !== 'closed') return null;
  return (
    <Button
      variant="outline"
      size="icon"
      aria-label={t('Open chat')}
      onClick={() => useChatPanel.getState().setOpen(true)}
      className={cn(
        'absolute bottom-5 z-30 size-10 rounded-full bg-gray-1 shadow-over max-md:hidden',
        mode === 'left' ? 'left-5' : 'right-5',
      )}
    >
      <ChatSparkIcon className="size-5" />
    </Button>
  );
}

function ChatLastPageTracker() {
  const { pathname, search } = useLocation();
  const onChatPage = useShellHandle().chat === 'full';
  useEffect(() => {
    if (!onChatPage) {
      useChatPanel.getState().setLastPage(`${pathname}${search}`);
    }
  }, [onChatPage, pathname, search]);
  return null;
}

function ChatUrlSync() {
  const navigate = useNavigate();
  const location = useLocation();
  const urlId = useActiveConversationId();
  const handedOverPrompt =
    isObject(location.state) && typeof location.state.prompt === 'string'
      ? location.state.prompt
      : undefined;

  useEffect(() => {
    if (handedOverPrompt === undefined) {
      useChatPanel.getState().showConversation(urlId);
      return;
    }
    useChatPanel.getState().newChat(handedOverPrompt);
    navigate(CHAT_ROUTE, { replace: true, state: null });
  }, [urlId, handedOverPrompt, navigate]);

  return null;
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
      panel?.querySelector('textarea')?.focus({ preventScroll: true });
      return;
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

const DOCK_MAX_CSS = `max(${chatLayoutUtils.DOCK_MIN_WIDTH}px, calc(100% - ${chatLayoutUtils.PAGE_COMFORT_WIDTH}px))`;
