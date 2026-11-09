import { ChatNotch } from './chat-notch';
import { isObject } from '@activepieces/core-utils';
import { t } from 'i18next';
import {
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import { useLocation, useMatches, useNavigate } from 'react-router-dom';

import { ChatSparkIcon } from '@/components/icons/chat-spark';
import { Button } from '@/components/ui/button';
import { chatDom } from '@/features/chat/lib/chat-dom';
import { pageFocus } from '@/features/chat/lib/follow/page-focus';
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

import { FollowAlongController } from './follow-along-controller';

const ChatChrome = lazyWithRetry(
  () => import('./chat-chrome').then((m) => ({ default: m.ChatChrome })),
  'chat-chrome',
);

export function useChatWidth(): ChatWidth {
  const fullPage = useShellHandle().chat === 'full';
  const sheetOpen = useLocation().hash === chatPanelUtils.SHEET_HASH;
  const docked = useChatPanel((s) => s.open);
  const mode = useChatPanel((s) => s.mode);
  return useSyncExternalStore(windowSizeHooks.subscribe, () =>
    chatLayoutUtils.widthFor({
      fullPage,
      open:
        window.innerWidth < chatLayoutUtils.MOBILE_BREAKPOINT
          ? sheetOpen
          : docked,
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

export function useChatSheet() {
  const navigate = useNavigate();
  const { pathname, search, state } = useLocation();
  const show = useCallback(
    () =>
      navigate(`${pathname}${search}${chatPanelUtils.SHEET_HASH}`, {
        state: { ...stateObject(state), [SHEET_STATE]: true },
      }),
    [navigate, pathname, search, state],
  );
  const hide = useCallback(() => {
    if (stateObject(state)[SHEET_STATE] === true) {
      navigate(-1);
      return;
    }
    navigate(`${pathname}${search}`, { replace: true, state });
  }, [navigate, pathname, search, state]);
  return { show, hide };
}

export function ChatPanel() {
  const chatWidth = useChatWidth();
  const mode = useChatPanel((s) => s.mode);
  const savedWidth = useChatPanel((s) => s.dockWidth);
  const [dragWidth, setDragWidth] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const [sheetDrag, setSheetDrag] = useState<SheetDrag | null>(null);
  const swipe = useRef({ startY: 0, lastY: 0, lastTime: 0, velocity: 0 });
  const panelRef = useRef<HTMLDivElement>(null);
  const sheet = useChatSheet();
  const viewportWidth = windowSizeHooks.useWidth();
  const full = chatWidth === 'full';
  const visible = chatWidth !== 'closed';
  const sheetOpen = chatWidth === 'sheet';
  const phone = viewportWidth < chatLayoutUtils.MOBILE_BREAKPOINT && !full;
  const side = full ? 'left' : mode;
  const width = dragWidth ?? savedWidth;

  if (visible && !mounted) {
    setMounted(true);
  }
  if (!sheetOpen && sheetDrag !== null) {
    setSheetDrag(null);
  }

  useChatKeys({ chatWidth, sheet });

  useEffect(() => {
    useChatPanel.getState().setPanelMounted(true);
    return () => useChatPanel.getState().setPanelMounted(false);
  }, []);

  useComposerFocus({ panelRef, visible });

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

  const startSwipe = (event: React.PointerEvent<HTMLElement>) => {
    const target = event.target;
    if (
      !sheetOpen ||
      event.button !== 0 ||
      !(target instanceof Element) ||
      !target.closest('[data-chat-header]') ||
      target.closest('button, a, input, textarea')
    ) {
      return;
    }
    event.currentTarget.setPointerCapture(event.pointerId);
    swipe.current = {
      startY: event.clientY,
      lastY: event.clientY,
      lastTime: event.timeStamp,
      velocity: 0,
    };
    setSheetDrag({
      offset: 0,
      height: event.currentTarget.getBoundingClientRect().height,
      dragging: true,
    });
  };

  const moveSwipe = (event: React.PointerEvent<HTMLElement>) => {
    if (!sheetDrag?.dragging) return;
    const track = swipe.current;
    const elapsed = event.timeStamp - track.lastTime;
    if (elapsed > 0) {
      track.velocity = (event.clientY - track.lastY) / elapsed;
      track.lastY = event.clientY;
      track.lastTime = event.timeStamp;
    }
    setSheetDrag({
      ...sheetDrag,
      offset: Math.max(0, event.clientY - track.startY),
    });
  };

  const endSwipe = () => {
    if (!sheetDrag?.dragging) return;
    const dismiss =
      sheetDrag.offset > sheetDrag.height * SHEET_DISMISS_SHARE ||
      swipe.current.velocity > SHEET_DISMISS_VELOCITY;
    if (!dismiss) {
      setSheetDrag(null);
      return;
    }
    setSheetDrag({ ...sheetDrag, offset: sheetDrag.height, dragging: false });
    sheet.hide();
  };

  return (
    <>
      {phone && (
        <div
          aria-hidden
          onClick={sheet.hide}
          style={
            sheetDrag
              ? { opacity: 1 - sheetDrag.offset / sheetDrag.height }
              : undefined
          }
          className={cn(
            'fixed inset-0 z-40 bg-scrim transition-opacity duration-150 ease-move motion-reduce:transition-none',
            !sheetOpen && 'pointer-events-none opacity-0',
            sheetDrag?.dragging && 'transition-none',
          )}
        />
      )}
      <aside
        ref={panelRef}
        id={chatLayoutUtils.PANEL_ID}
        aria-label={t('Chat')}
        inert={!visible}
        onPointerDown={phone ? startSwipe : undefined}
        onPointerMove={phone ? moveSwipe : undefined}
        onPointerUp={phone ? endSwipe : undefined}
        onLostPointerCapture={
          phone && sheetDrag?.dragging ? () => setSheetDrag(null) : undefined
        }
        style={
          phone
            ? sheetDrag
              ? { translate: `0 ${sheetDrag.offset}px` }
              : undefined
            : full
            ? { width: '100%' }
            : {
                width: visible ? width : 0,
                maxWidth: visible ? DOCK_MAX_CSS : undefined,
              }
        }
        className={cn(
          phone
            ? [
                'fixed inset-x-0 top-2 bottom-0 z-40 flex flex-col overflow-hidden rounded-t-xl border bg-gray-1 shadow-over transition-[translate,visibility] duration-150 ease-move motion-reduce:transition-none',
                !sheetOpen && 'invisible translate-y-full',
                sheetDrag?.dragging && 'transition-none',
              ]
            : [
                'relative flex shrink-0 flex-col overflow-hidden bg-gray-1',
                side === 'right' && 'order-last',
                visible && !full && (side === 'left' ? 'border-r' : 'border-l'),
                dragWidth === null &&
                  'transition-[width] duration-[var(--ap-move,200ms)] ease-move motion-reduce:transition-none',
              ],
        )}
      >
        <ChatRouterBinding />
        <ChatLastPageTracker />
        {full && <ChatUrlSync />}
        <FollowAlongController />
        <ChatAnnouncer />
        {mounted && (
          <Suspense fallback={null}>
            <ChatChrome />
          </Suspense>
        )}
        {visible && !full && !phone && (
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
    </>
  );
}

export function ChatLauncher({ className }: { className: string }) {
  const chatWidth = useChatWidth();
  const mode = useChatPanel((s) => s.mode);
  const hasConversation = useChatPanel((s) => s.conversationId !== null);
  const phone = windowSizeHooks.useWidth() < chatLayoutUtils.MOBILE_BREAKPOINT;
  const sheet = useChatSheet();
  if (chatWidth !== 'closed') return null;
  if (phone) {
    return hasConversation ? <ChatSheetPill onOpen={sheet.show} /> : null;
  }
  return <ChatNotch className={className} />;
}

function ChatAnnouncer() {
  const announcement = useChatPanel((s) => s.announcement);
  return (
    <div aria-live="polite" role="status" className="sr-only">
      {announcement && <span key={announcement.id}>{announcement.text}</span>}
    </div>
  );
}

function ChatSheetPill({ onOpen }: { onOpen: () => void }) {
  return (
    <Button
      variant="outline"
      onClick={onOpen}
      aria-label={t('Open chat')}
      className="fixed left-1/2 z-40 h-11 -translate-x-1/2 animate-in fade-in-0 slide-in-from-bottom-2 gap-2 rounded-full bg-gray-1 pr-4 pl-3 text-gray-12 shadow-lift duration-150 motion-reduce:animate-none"
      style={{ bottom: 'calc(env(safe-area-inset-bottom) + 12px)' }}
    >
      <ChatSparkIcon className="size-5" />
      {t('Chat')}
    </Button>
  );
}

function useChatKeys({
  chatWidth,
  sheet,
}: {
  chatWidth: ChatWidth;
  sheet: ReturnType<typeof useChatSheet>;
}) {
  const latest = useRef({ chatWidth, sheet });
  latest.current = { chatWidth, sheet };
  useEffect(() => {
    const onKey = (event: KeyboardEvent) =>
      handleChatKey({ event, ...latest.current });
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}

function handleChatKey({
  event,
  chatWidth,
  sheet,
}: {
  event: KeyboardEvent;
  chatWidth: ChatWidth;
  sheet: ReturnType<typeof useChatSheet>;
}): void {
  const full = chatWidth === 'full';
  const focusInChat = pageFocus.inChat(document.activeElement);
  const mod = (event.metaKey || event.ctrlKey) && !event.altKey;
  const key = event.key.toLowerCase();
  if (mod && event.shiftKey && key === 'o') {
    event.preventDefault();
    chatPanelUtils.startNewChat();
    chatDom.composer()?.focus();
    return;
  }
  if (mod && !event.shiftKey && key === 'j') {
    event.preventDefault();
    if (chatWidth === 'sheet') {
      sheet.hide();
    } else if (!full && window.innerWidth < chatLayoutUtils.MOBILE_BREAKPOINT) {
      sheet.show();
    } else if (full || (chatWidth !== 'closed' && !focusInChat)) {
      chatDom.composer()?.focus();
    } else {
      useChatPanel.getState().setOpen(chatWidth === 'closed');
    }
    return;
  }
  if (
    event.key === 'Escape' &&
    !full &&
    chatWidth !== 'closed' &&
    focusInChat &&
    !hasText(document.activeElement) &&
    !hasText(chatDom.composer()) &&
    chatDom.escapeFree(event)
  ) {
    chatDom.claimEscape(event);
    if (chatWidth === 'sheet') sheet.hide();
    else useChatPanel.getState().setOpen(false);
  }
}

function hasText(element: Element | null): boolean {
  return (
    (element instanceof HTMLTextAreaElement ||
      element instanceof HTMLInputElement) &&
    element.value.trim().length > 0
  );
}

function stateObject(state: unknown): Record<string, unknown> {
  return isObject(state) ? state : {};
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

const SHEET_STATE = 'chatSheet';
const SHEET_DISMISS_SHARE = 0.25;
const SHEET_DISMISS_VELOCITY = 0.5;
const DOCK_MAX_CSS = `max(${chatLayoutUtils.DOCK_MIN_WIDTH}px, calc(100% - ${chatLayoutUtils.PAGE_COMFORT_WIDTH}px))`;

type SheetDrag = { offset: number; height: number; dragging: boolean };
