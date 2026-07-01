import { SeekPage } from '@activepieces/core-utils';
import { ChatConversation } from '@activepieces/shared';
import { useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import {
  Ellipsis,
  Pencil,
  PictureInPicture,
  PictureInPicture2,
  Trash2,
  X,
} from 'lucide-react';
import {
  useState,
  useEffect,
  useLayoutEffect,
  useCallback,
  useRef,
  useMemo,
} from 'react';
import { createPortal } from 'react-dom';
import { Rnd } from 'react-rnd';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

import { AIChatBox } from '@/app/routes/chat-with-ai/ai-chat-box';
import { ConversationSidebarToggle } from '@/app/routes/chat-with-ai/components/conversation-sidebar-toggle';
import { TypewriterText } from '@/app/routes/chat-with-ai/components/typewriter-text';
import { ConversationList } from '@/app/routes/chat-with-ai/conversation-list';
import { SquarePenIcon } from '@/components/icons/square-pen';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { chatApi } from '@/features/chat/lib/chat-api';
import { chatUtils } from '@/features/chat/lib/chat-utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

const SIDEBAR_PINNED_STORAGE_KEY = 'chat-sidebar-pinned';
const FLOAT_POS_STORAGE_KEY = 'chat-float-pos';
const FLOAT_SIZE_STORAGE_KEY = 'chat-float-size';
const FLOAT_MIN_WIDTH = 400;
const FLOAT_MAX_WIDTH = 720;
const FLOAT_MIN_HEIGHT = 520;
const FLOAT_MAX_HEIGHT = 920;
const FLOAT_VIEWPORT_MARGIN = 16;
const FLOAT_DRAG_HANDLE_CLASS = 'chat-drag-handle';
const FLOAT_BOUNDS_CLASS = 'chat-float-bounds';
const FLOAT_DEFAULT_WIDTH_RATIO = 0.4;
const FLOAT_DEFAULT_HEIGHT_RATIO = 0.82;

const RESIZE_ALL_HANDLES = {
  top: true,
  right: true,
  bottom: true,
  left: true,
  topRight: true,
  bottomRight: true,
  bottomLeft: true,
  topLeft: true,
};

// Comfortable grab targets that sit just inside the card border. react-rnd
// positions handles with negative offsets by default, so we don't clip the root.
const EDGE = 10;
const CORNER = 18;
const RESIZE_HANDLE_STYLES: Record<string, React.CSSProperties> = {
  top: { height: EDGE, top: -EDGE / 2 },
  bottom: { height: EDGE, bottom: -EDGE / 2 },
  left: { width: EDGE, left: -EDGE / 2 },
  right: { width: EDGE, right: -EDGE / 2 },
  topLeft: {
    width: CORNER,
    height: CORNER,
    top: -CORNER / 2,
    left: -CORNER / 2,
  },
  topRight: {
    width: CORNER,
    height: CORNER,
    top: -CORNER / 2,
    right: -CORNER / 2,
  },
  bottomLeft: {
    width: CORNER,
    height: CORNER,
    bottom: -CORNER / 2,
    left: -CORNER / 2,
  },
  bottomRight: {
    width: CORNER,
    height: CORNER,
    bottom: -CORNER / 2,
    right: -CORNER / 2,
  },
};

export function WorkspaceChatPanel({
  showClose,
  onClose,
  floating,
  canPopOut,
  onPopOut,
  onDock,
  showDockHint,
  onDismissDockHint,
}: {
  showClose?: boolean;
  onClose?: () => void;
  floating?: boolean;
  canPopOut?: boolean;
  onPopOut?: () => void;
  onDock?: () => void;
  showDockHint?: boolean;
  onDismissDockHint?: () => void;
}) {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlConversationId = searchParams.get('chat');
  // The Home nav item lands on /chat?new=1 to force a fresh, empty chat
  // (otherwise the self-heal below would restore the last conversation).
  const newChatRequested = searchParams.get('new');
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(urlConversationId);
  const [sessionKey, setSessionKey] = useState(0);
  const [conversationTitle, setConversationTitle] = useState<string | null>(
    null,
  );
  const [titleResolved, setTitleResolved] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const renameCancelledRef = useRef(false);
  const [sidebarPinned, setSidebarPinned] = useState(
    () => localStorage.getItem(SIDEBAR_PINNED_STORAGE_KEY) === 'true',
  );
  const isMobile = useIsMobile();
  const [floatSize, setFloatSize] = useState(readFloatSize);
  const [floatPos, setFloatPos] = useState(() => readFloatPos(floatSize));
  const innerRef = useRef<HTMLDivElement | null>(null);

  const toggleSidebar = useCallback(() => {
    setSidebarPinned((prev) => {
      const next = !prev;
      localStorage.setItem(SIDEBAR_PINNED_STORAGE_KEY, String(next));
      return next;
    });
  }, []);

  // react-rnd owns the live drag/resize gesture (smooth, rAF-batched, clamped to
  // the inset bounds box); we only fold the result into React state + localStorage
  // on release so the heavy chat subtree never re-renders mid-gesture.
  const handleDragStop = useCallback((pos: { x: number; y: number }) => {
    const next = { x: pos.x, y: pos.y };
    setFloatPos(next);
    localStorage.setItem(FLOAT_POS_STORAGE_KEY, JSON.stringify(next));
  }, []);

  const handleResizeStop = useCallback(
    (
      size: { width: number; height: number },
      pos: { x: number; y: number },
    ) => {
      setFloatSize(size);
      setFloatPos(pos);
      localStorage.setItem(FLOAT_SIZE_STORAGE_KEY, JSON.stringify(size));
      localStorage.setItem(FLOAT_POS_STORAGE_KEY, JSON.stringify(pos));
    },
    [],
  );

  // On pop-out, grow the card out of its own corner with a soft scale + fade —
  // no cross-screen slide. The scale runs on the inner wrapper, never on the Rnd
  // root, so it can't fight the translate react-rnd applies for positioning.
  const wasFloatingRef = useRef(floating);
  useLayoutEffect(() => {
    const becameFloating = floating && !wasFloatingRef.current;
    wasFloatingRef.current = floating;
    const inner = innerRef.current;
    if (!becameFloating || !inner) {
      return;
    }
    inner.style.transformOrigin = 'bottom left';
    inner.animate(
      [
        { transform: 'scale(0.92)', opacity: 0 },
        { transform: 'scale(1)', opacity: 1 },
      ],
      { duration: 200, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' },
    );
  });

  const selectedConversationId = activeConversationId;

  const setChatParam = useCallback(
    (conversationId: string | null) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (conversationId) {
            next.set('chat', conversationId);
          } else {
            next.delete('chat');
          }
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  // The chat panel's identity is owned in state, not derived from the URL — so a
  // page navigation that drops `?chat` never remounts the chat. This effect keeps
  // state in sync with genuine URL changes (deep links, browser back/forward) and
  // self-heals the param when a navigation strips it.
  useEffect(() => {
    // A pending "new chat" request owns the URL — let the effect below handle it
    // instead of self-healing the stripped ?chat param back.
    if (newChatRequested) return;
    if (urlConversationId === activeConversationId) return;
    if (urlConversationId) {
      setActiveConversationId(urlConversationId);
      setSessionKey((k) => k + 1);
      setConversationTitle(null);
      setTitleResolved(false);
    } else if (activeConversationId) {
      setChatParam(activeConversationId);
    }
  }, [urlConversationId, activeConversationId, setChatParam, newChatRequested]);

  // Clicking Home (→ /chat?new=1) starts a fresh, empty chat regardless of the
  // current conversation, then strips the marker so the URL settles on /chat.
  useEffect(() => {
    if (!newChatRequested) return;
    setActiveConversationId(null);
    setSessionKey((k) => k + 1);
    setConversationTitle(null);
    setTitleResolved(false);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete('new');
        next.delete('chat');
        return next;
      },
      { replace: true },
    );
  }, [newChatRequested, setSearchParams]);

  const handleNewChat = useCallback(() => {
    setActiveConversationId(null);
    setSessionKey((k) => k + 1);
    setConversationTitle(null);
    setTitleResolved(false);
    setChatParam(null);
  }, [setChatParam]);

  const handleSelectConversation = useCallback(
    (conversationId: string) => {
      setActiveConversationId(conversationId);
      setSessionKey((k) => k + 1);
      setConversationTitle(null);
      setTitleResolved(false);
      setChatParam(conversationId);
    },
    [setChatParam],
  );

  const handleConversationCreated = useCallback(
    (conversationId: string) => {
      setActiveConversationId(conversationId);
      setChatParam(conversationId);
      void queryClient.invalidateQueries({
        queryKey: ['chat-conversations'],
      });
    },
    [setChatParam, queryClient],
  );

  const handleTitleUpdate = useCallback(
    (title: string) => {
      setConversationTitle(title);
      void queryClient.invalidateQueries({
        queryKey: ['chat-conversations'],
      });
    },
    [queryClient],
  );

  const handleRename = useCallback(async () => {
    if (renameCancelledRef.current) {
      renameCancelledRef.current = false;
      return;
    }
    const convId = selectedConversationId;
    if (!convId || !renameValue.trim()) {
      setIsRenaming(false);
      return;
    }
    renameCancelledRef.current = true;
    try {
      await chatApi.updateConversation(convId, {
        title: renameValue.trim(),
      });
      if (selectedConversationId === convId) {
        setConversationTitle(renameValue.trim());
      }
      void queryClient.invalidateQueries({
        queryKey: ['chat-conversations'],
      });
    } catch {
      toast.error(t('Failed to rename conversation'));
    } finally {
      renameCancelledRef.current = false;
      setIsRenaming(false);
    }
  }, [selectedConversationId, renameValue, queryClient]);

  const handleDelete = useCallback(() => {
    const convId = selectedConversationId;
    if (!convId) return;
    handleNewChat();
    chatApi.deleteConversation(convId).then(
      () => {
        void queryClient.invalidateQueries({
          queryKey: ['chat-conversations'],
        });
      },
      () => {
        toast.error(t('Failed to delete conversation'));
      },
    );
  }, [selectedConversationId, queryClient, handleNewChat]);

  useEffect(() => {
    if (!selectedConversationId || conversationTitle) return;
    let cancelled = false;
    chatApi
      .getConversation(selectedConversationId)
      .then((conv) => {
        if (cancelled) return;
        if (conv.title) setConversationTitle(conv.title);
        setTitleResolved(true);
      })
      .catch(() => {
        if (!cancelled) setTitleResolved(true);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedConversationId, conversationTitle]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        (e.metaKey || e.ctrlKey) &&
        e.shiftKey &&
        e.key.toLowerCase() === 'o'
      ) {
        e.preventDefault();
        handleNewChat();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleNewChat]);

  useEffect(() => {
    const handler = () => handleNewChat();
    window.addEventListener(chatUtils.newChatEvent, handler);
    return () => window.removeEventListener(chatUtils.newChatEvent, handler);
  }, [handleNewChat]);

  const cachedTitle = useMemo(() => {
    if (conversationTitle) return conversationTitle;
    if (!selectedConversationId) return null;
    const cached = queryClient.getQueryData<SeekPage<ChatConversation>>([
      'chat-conversations',
    ]);
    return (
      cached?.data?.find((c) => c.id === selectedConversationId)?.title ?? null
    );
  }, [conversationTitle, selectedConversationId, queryClient]);
  const isTitleLoading =
    !!selectedConversationId && !cachedTitle && !titleResolved;
  const displayTitle = cachedTitle
    ? chatUtils.sanitizeTitle(cachedTitle)
    : t('New Chat');
  const effectivePinned = !isMobile && sidebarPinned && !floating;

  const renderHeader = (draggable?: boolean) => (
    <div
      className={cn(
        'shrink-0 flex items-center gap-1.5 px-3 h-12 border-b',
        draggable && `${FLOAT_DRAG_HANDLE_CLASS} cursor-grab select-none`,
      )}
    >
      <ConversationSidebarToggle
        pinned={effectivePinned}
        isMobile={isMobile}
        onTogglePin={toggleSidebar}
        onNewChat={handleNewChat}
        onSelect={handleSelectConversation}
        selectedId={selectedConversationId}
      />
      {!effectivePinned && (
        <TooltipProvider delayDuration={400}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 sm:h-7 sm:w-7 shrink-0"
                onClick={handleNewChat}
              >
                <SquarePenIcon size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="flex items-center gap-2">
              {t('New chat')}
              <span className="text-[11px] opacity-50">⇧⌘O</span>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      {isRenaming ? (
        <Input
          autoFocus
          value={renameValue}
          onChange={(e) => setRenameValue(e.target.value)}
          onBlur={() => void handleRename()}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void handleRename();
            if (e.key === 'Escape') {
              renameCancelledRef.current = true;
              setIsRenaming(false);
            }
          }}
          className="h-7 text-sm font-semibold max-w-[300px]"
        />
      ) : (
        <>
          {isTitleLoading ? (
            <Skeleton className="h-4 w-32" />
          ) : (
            <TypewriterText
              text={displayTitle}
              className="text-sm font-semibold truncate"
            />
          )}
          {selectedConversationId && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0"
                >
                  <Ellipsis className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem
                  onClick={() => {
                    setRenameValue(
                      conversationTitle
                        ? chatUtils.sanitizeTitle(conversationTitle)
                        : '',
                    );
                    setIsRenaming(true);
                  }}
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  {t('Rename')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => void handleDelete()}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t('Delete')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </>
      )}
      <div className="flex-1" />
      {!floating && canPopOut && onPopOut && (
        <TooltipProvider delayDuration={400}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={onPopOut}
              >
                <PictureInPicture2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t('Pop out chat')}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      {floating && onDock && (
        <Popover open={!!showDockHint}>
          <PopoverAnchor asChild>
            <span className="inline-flex">
              <TooltipProvider delayDuration={400}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0"
                      onClick={onDock}
                    >
                      <PictureInPicture className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{t('Dock chat')}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </span>
          </PopoverAnchor>
          <PopoverContent
            side="bottom"
            align="end"
            className="w-64 border-0 bg-foreground p-3 text-background shadow-lg"
            onOpenAutoFocus={(event) => event.preventDefault()}
          >
            <p className="text-sm font-medium">
              {t('Back to the original view')}
            </p>
            <p className="mt-1 text-xs text-background/70">
              {t(
                'Dock the chat here anytime to see it side by side with your work again.',
              )}
            </p>
            <div className="mt-3 flex justify-end">
              <Button
                size="sm"
                className="h-7 bg-background text-foreground hover:bg-background/90"
                onClick={onDismissDockHint}
              >
                {t('Got it')}
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      )}
      {showClose && onClose && (
        <TooltipProvider delayDuration={400}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t('Close chat')}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );

  const body = (
    <div className="flex-1 min-h-0">
      <AIChatBox
        key={`chat-${sessionKey}`}
        incognito={false}
        conversationId={selectedConversationId}
        onTitleUpdate={handleTitleUpdate}
        onConversationCreated={handleConversationCreated}
      />
    </div>
  );

  if (!floating) {
    return (
      <div className="flex h-full overflow-hidden bg-background">
        {effectivePinned && (
          <div className="shrink-0 overflow-hidden border-r animate-in slide-in-from-left-2 duration-200">
            <ConversationList
              onNewChat={handleNewChat}
              onSelect={handleSelectConversation}
              selectedId={selectedConversationId}
            />
          </div>
        )}
        <div className="flex flex-col flex-1 min-w-0 min-h-0 overflow-hidden">
          {renderHeader()}
          {body}
        </div>
      </div>
    );
  }

  const floatMaxWidth = Math.min(
    FLOAT_MAX_WIDTH,
    window.innerWidth - 2 * FLOAT_VIEWPORT_MARGIN,
  );
  const floatMaxHeight = Math.min(
    FLOAT_MAX_HEIGHT,
    window.innerHeight - 2 * FLOAT_VIEWPORT_MARGIN,
  );

  // Portal to <body> so the card escapes the nested resizable-panel layout: with
  // body as the offset parent (the app shell is height-locked, so it never
  // scrolls) react-rnd's default absolute positioning maps 1:1 to viewport
  // coordinates, which is what makes bounds="window" clamp correctly on both drag
  // and resize. Rendering inline with position:fixed broke that math and let the
  // card cross the screen edges.
  return createPortal(
    <>
      {/* Invisible viewport box inset by the margin — react-rnd clamps drag AND
          resize to this element, so the card stops `FLOAT_VIEWPORT_MARGIN` from
          every edge instead of flush against the screen. */}
      <div
        aria-hidden
        className={FLOAT_BOUNDS_CLASS}
        style={{
          position: 'fixed',
          inset: FLOAT_VIEWPORT_MARGIN,
          pointerEvents: 'none',
        }}
      />
      <Rnd
        position={{ x: floatPos.x, y: floatPos.y }}
        size={{ width: floatSize.width, height: floatSize.height }}
        minWidth={FLOAT_MIN_WIDTH}
        minHeight={FLOAT_MIN_HEIGHT}
        maxWidth={floatMaxWidth}
        maxHeight={floatMaxHeight}
        bounds={`.${FLOAT_BOUNDS_CLASS}`}
        dragHandleClassName={FLOAT_DRAG_HANDLE_CLASS}
        cancel="button, input, textarea, select, a, [role='menuitem'], [contenteditable='true']"
        enableResizing={RESIZE_ALL_HANDLES}
        resizeHandleStyles={RESIZE_HANDLE_STYLES}
        className="z-50 rounded-xl border bg-background shadow-2xl"
        onDragStop={(_e, d) => handleDragStop({ x: d.x, y: d.y })}
        onResizeStop={(_e, _dir, ref, _delta, position) =>
          handleResizeStop(
            { width: ref.offsetWidth, height: ref.offsetHeight },
            position,
          )
        }
      >
        <div
          ref={innerRef}
          data-chat-dense
          className="flex flex-col w-full h-full min-w-0 min-h-0 overflow-hidden rounded-xl"
        >
          {renderHeader(true)}
          {body}
        </div>
      </Rnd>
    </>,
    document.body,
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function clampPos(
  pos: { x: number; y: number },
  width: number,
  height: number,
): { x: number; y: number } {
  const maxX = Math.max(
    FLOAT_VIEWPORT_MARGIN,
    window.innerWidth - width - FLOAT_VIEWPORT_MARGIN,
  );
  const maxY = Math.max(
    FLOAT_VIEWPORT_MARGIN,
    window.innerHeight - height - FLOAT_VIEWPORT_MARGIN,
  );
  return {
    x: clamp(pos.x, FLOAT_VIEWPORT_MARGIN, maxX),
    y: clamp(pos.y, FLOAT_VIEWPORT_MARGIN, maxY),
  };
}

function readFloatPos(size: { width: number; height: number }): {
  x: number;
  y: number;
} {
  // Snug in the bottom-left corner by default.
  const fallback = clampPos(
    {
      x: FLOAT_VIEWPORT_MARGIN,
      y: window.innerHeight - size.height - FLOAT_VIEWPORT_MARGIN,
    },
    size.width,
    size.height,
  );
  try {
    const raw = localStorage.getItem(FLOAT_POS_STORAGE_KEY);
    if (!raw) {
      return fallback;
    }
    const parsed = JSON.parse(raw);
    if (typeof parsed?.x === 'number' && typeof parsed?.y === 'number') {
      return clampPos(parsed, size.width, size.height);
    }
  } catch {
    return fallback;
  }
  return fallback;
}

function readFloatSize(): { width: number; height: number } {
  // Keep the floating chat comfortably readable: clamp to sensible mins and to
  // the viewport so a roomy default (or a stale tiny stored size) never lands
  // too small or off-screen.
  const maxWidth = Math.min(
    FLOAT_MAX_WIDTH,
    window.innerWidth - 2 * FLOAT_VIEWPORT_MARGIN,
  );
  const maxHeight = Math.min(
    FLOAT_MAX_HEIGHT,
    window.innerHeight - 2 * FLOAT_VIEWPORT_MARGIN,
  );
  const fit = (size: { width: number; height: number }) => ({
    width: clamp(size.width, Math.min(FLOAT_MIN_WIDTH, maxWidth), maxWidth),
    height: clamp(
      size.height,
      Math.min(FLOAT_MIN_HEIGHT, maxHeight),
      maxHeight,
    ),
  });
  // Scale the default to the viewport so it's comfortably usable on any screen.
  const fallback = fit({
    width: Math.round(window.innerWidth * FLOAT_DEFAULT_WIDTH_RATIO),
    height: Math.round(window.innerHeight * FLOAT_DEFAULT_HEIGHT_RATIO),
  });
  try {
    const raw = localStorage.getItem(FLOAT_SIZE_STORAGE_KEY);
    if (!raw) {
      return fallback;
    }
    const parsed = JSON.parse(raw);
    if (
      typeof parsed?.width === 'number' &&
      typeof parsed?.height === 'number'
    ) {
      return fit(parsed);
    }
  } catch {
    return fallback;
  }
  return fallback;
}
