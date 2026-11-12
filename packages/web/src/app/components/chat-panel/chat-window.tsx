import { isObject } from '@activepieces/core-utils';
import { t } from 'i18next';
import {
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { useLocation, useMatches, useNavigate } from 'react-router-dom';

import { chatDom } from '@/features/chat/lib/chat-dom';
import { chatScrollAnchor } from '@/features/chat/lib/chat-scroll-anchor';
import {
  ChatWidth,
  chatLayoutUtils,
} from '@/features/workspace/lib/chat-layout';
import {
  chatPanelUtils,
  useChatPanel,
} from '@/features/workspace/lib/chat-panel-open';
import { layoutMove } from '@/features/workspace/lib/layout-move';
import { useRailOpen } from '@/features/workspace/lib/rail-collapsed';
import { useChatOn } from '@/features/workspace/lib/use-chat-on';
import { windowSizeHooks } from '@/features/workspace/lib/window-size-hooks';
import { lazyWithRetry } from '@/lib/lazy-with-retry';
import { useShellHandle } from '@/lib/shell-handle';
import { cn } from '@/lib/utils';

import { FollowAlongController } from './follow-along-controller';
import { useSheetSwipe } from './use-sheet-swipe';

const loadChatChrome = () =>
  import('./chat-chrome').then((m) => ({ default: m.ChatChrome }));
const ChatChrome = lazyWithRetry(loadChatChrome, 'chat-chrome');

function useCardWidth(): number {
  const railOpen = useRailOpen();
  const viewportWidth = windowSizeHooks.useViewportWidth();
  const builder = useShellHandle().shell === 'builder';
  return chatLayoutUtils.cardInnerWidth({
    viewportWidth,
    railOpen,
    chrome: builder ? BUILDER_CARD_CHROME : undefined,
  });
}

function useDockWidth(dragWidth: number | null = null): number {
  const savedWidth = useChatPanel((s) => s.dockWidth);
  const cardWidth = useCardWidth();
  return chatLayoutUtils.shownDockWidth({
    savedWidth: dragWidth ?? savedWidth,
    cardWidth,
  });
}

export function useChatWidth(): ChatWidth {
  const fullPage = useShellHandle().chat === 'full';
  const chatOn = useChatOn();
  const sheetOpen = useLocation().hash === chatPanelUtils.SHEET_HASH;
  const docked = useChatPanel((s) => s.open);
  const mode = useChatPanel((s) => s.mode);
  const phone = windowSizeHooks.useIsPhone();
  return chatLayoutUtils.widthFor({
    fullPage,
    open: chatOn && (phone ? sheetOpen : docked),
    mode,
    phone,
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
  const [dragWidth, setDragWidth] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const scrimRef = useRef<HTMLButtonElement>(null);
  const sheet = useChatSheet();
  const full = chatWidth === 'full';
  const visible = chatWidth !== 'closed';
  const sheetOpen = chatWidth === 'sheet';
  const phone = windowSizeHooks.useIsPhone() && !full;
  const side = full ? 'left' : mode;
  const width = useDockWidth(dragWidth);
  const cardWidth = useCardWidth();
  const layoutKey = chatWidth;
  const committedLayout = useRef(layoutKey);

  if (committedLayout.current !== layoutKey && pendingCapture !== layoutKey) {
    pendingCapture = layoutKey;
    chatScrollAnchor.capture();
  }

  useLayoutEffect(() => {
    if (committedLayout.current === layoutKey) return;
    committedLayout.current = layoutKey;
    pendingCapture = null;
    chatScrollAnchor.restore();
  }, [layoutKey]);

  if (visible && !mounted) {
    setMounted(true);
  }

  useEffect(() => {
    if (mounted) return;
    const prewarm = setTimeout(() => {
      loadChatChrome().catch(() => undefined);
    }, PREWARM_MS);
    return () => clearTimeout(prewarm);
  }, [mounted]);

  useChatKeys({ chatWidth, sheet });

  useEffect(() => {
    useChatPanel.getState().setPanelMounted(true);
    return () => useChatPanel.getState().setPanelMounted(false);
  }, []);

  useEffect(() => layoutMove.watchKeyPresses(), []);

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

  const swipe = useSheetSwipe({
    enabled: phone && sheetOpen,
    panelRef,
    scrimRef,
    onDismiss: sheet.hide,
  });

  return (
    <>
      {phone && (
        <button
          type="button"
          ref={scrimRef}
          tabIndex={-1}
          aria-label={t('Close chat')}
          aria-hidden={!sheetOpen || undefined}
          onClick={sheet.hide}
          className={cn(
            'fixed inset-0 z-40 cursor-default bg-scrim transition-opacity motion-reduce:duration-(--dur-fast)',
            sheetOpen
              ? 'duration-(--dur-sheet) ease-(--ease-ap-drawer)'
              : 'pointer-events-none opacity-0 duration-(--dur-move) ease-(--ease-ap-out)',
          )}
        />
      )}
      <aside
        ref={panelRef}
        id={chatLayoutUtils.PANEL_ID}
        aria-label={t('Chat')}
        role={phone && sheetOpen ? 'dialog' : undefined}
        aria-modal={phone && sheetOpen ? true : undefined}
        inert={!visible}
        onPointerDown={phone ? swipe.onPointerDown : undefined}
        style={
          phone ? undefined : { width: full ? '100%' : visible ? width : 0 }
        }
        className={cn(
          phone
            ? [
                'fixed inset-x-0 top-2 bottom-0 z-40 flex flex-col overflow-hidden rounded-t-xl border bg-gray-1 shadow-over transition-[translate,opacity,visibility] motion-reduce:transition-[opacity,visibility] motion-reduce:duration-(--dur-fast)',
                sheetOpen
                  ? 'transition-[translate,opacity] duration-(--dur-sheet) ease-(--ease-ap-drawer) motion-reduce:transition-opacity'
                  : 'invisible translate-y-full duration-(--dur-move) ease-(--ease-ap-out) motion-reduce:translate-y-0 motion-reduce:opacity-0',
              ]
            : [
                'relative flex shrink-0 flex-col overflow-hidden bg-gray-1 [view-transition-name:ap-chat]',
                side === 'right' && 'order-last',
                visible && !full && (side === 'left' ? 'border-r' : 'border-l'),
              ],
        )}
      >
        <ChatRouterBinding />
        <FollowAlongController />
        <ChatAnnouncer />
        <div
          style={phone ? undefined : { width: full ? '100%' : `${width}px` }}
          className={cn(
            '@container/chat flex flex-col',
            phone
              ? 'min-h-0 flex-1'
              : ['absolute inset-y-0', side === 'left' ? 'left-0' : 'right-0'],
          )}
        >
          {mounted && (
            <Suspense fallback={null}>
              <ChatChrome />
            </Suspense>
          )}
        </div>
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
              cancelOnEscape(event);
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
                'absolute inset-y-0 w-0.5 bg-gray-8 transition-opacity duration-(--dur-micro) ease-[ease] group-hover/edge:opacity-100 group-focus-visible/edge:opacity-100',
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

function ChatAnnouncer() {
  const announcement = useChatPanel((s) => s.announcement);
  return (
    <div aria-live="polite" role="status" className="sr-only">
      {announcement && <span key={announcement.id}>{announcement.text}</span>}
    </div>
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
  const focusInChat = chatDom.inChat(document.activeElement);
  const shortcut = chatDom.shortcutOf(event);
  if (shortcut === 'newChat') {
    event.preventDefault();
    chatPanelUtils.startNewChat();
    if (!full && chatWidth !== 'sheet' && windowSizeHooks.isPhone()) {
      sheet.show();
    }
    return;
  }
  if (shortcut === 'toggle') {
    event.preventDefault();
    if (chatWidth === 'sheet') {
      sheet.hide();
    } else if (!full && windowSizeHooks.isPhone()) {
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

function cancelOnEscape(event: React.PointerEvent<HTMLElement>): void {
  const handle = event.currentTarget;
  const pointerId = event.pointerId;
  const onKey = (key: KeyboardEvent) => {
    if (key.key !== 'Escape') return;
    key.preventDefault();
    key.stopImmediatePropagation();
    handle.releasePointerCapture(pointerId);
  };
  window.addEventListener('keydown', onKey, true);
  handle.addEventListener(
    'lostpointercapture',
    () => window.removeEventListener('keydown', onKey, true),
    { once: true },
  );
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

function ChatRouterBinding() {
  const navigate = useNavigate();
  const location = useLocation();
  const fullPage = useShellHandle().chat === 'full';
  const latest = useRef({ location, fullPage });
  latest.current = { location, fullPage };

  useLayoutEffect(() => chatPanelUtils.routeCommitted(), [location.key]);

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

const SHEET_STATE = 'chatSheet';
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
const BUILDER_CARD_CHROME = 14;
let pendingCapture: string | null = null;
