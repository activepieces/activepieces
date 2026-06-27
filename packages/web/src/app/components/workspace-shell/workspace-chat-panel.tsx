import { SeekPage } from '@activepieces/core-utils';
import { ChatConversation } from '@activepieces/shared';
import {
  DndContext,
  PointerSensor,
  useDraggable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent, DraggableSyntheticListeners } from '@dnd-kit/core';
import { restrictToWindowEdges } from '@dnd-kit/modifiers';
import { CSS } from '@dnd-kit/utilities';
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
import {
  STAGE_TRANSITION_EASING,
  STAGE_TRANSITION_MS,
} from '@/lib/ui-transitions';
import { cn } from '@/lib/utils';

const SIDEBAR_PINNED_STORAGE_KEY = 'chat-sidebar-pinned';
const FLOAT_POS_STORAGE_KEY = 'chat-float-pos';
const FLOAT_SIZE_STORAGE_KEY = 'chat-float-size';
const FLOAT_DEFAULT_WIDTH = 460;
const FLOAT_DEFAULT_HEIGHT = 720;
const FLOAT_MIN_WIDTH = 380;
const FLOAT_MAX_WIDTH = 760;
const FLOAT_MIN_HEIGHT = 480;
const FLOAT_VIEWPORT_MARGIN = 32;
const FLOAT_DRAG_ID = 'workspace-chat-window';

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
  const floatCardRef = useRef<HTMLDivElement | null>(null);
  const pendingSizeRef = useRef(floatSize);
  const pendingPosRef = useRef(floatPos);
  const resizeStartRef = useRef<{
    pointerX: number;
    pointerY: number;
    width: number;
    height: number;
    left: number;
    top: number;
    axis: 'x' | 'y' | 'both';
  } | null>(null);
  const dragSensors = useSensors(
    useSensor(ChatDragPointerSensor, {
      activationConstraint: { distance: 4 },
    }),
  );

  const toggleSidebar = useCallback(() => {
    setSidebarPinned((prev) => {
      const next = !prev;
      localStorage.setItem(SIDEBAR_PINNED_STORAGE_KEY, String(next));
      return next;
    });
  }, []);

  // The card is anchored to its top-left corner. When it's jammed against the
  // viewport edge (the default bottom-right dock), there's no room to grow the
  // right/bottom edge — so we also slide the anchor up/left as the card enlarges,
  // keeping it on-screen and resizable in both directions. During the drag we
  // mutate the card's style directly so the heavy chat subtree never re-renders —
  // that's what keeps it smooth — and commit to state only on release.
  const startResize = useCallback(
    (axis: 'x' | 'y' | 'both') => (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      const card = floatCardRef.current;
      const rect = card?.getBoundingClientRect();
      resizeStartRef.current = {
        pointerX: e.clientX,
        pointerY: e.clientY,
        width: card?.offsetWidth ?? floatSize.width,
        height: card?.offsetHeight ?? floatSize.height,
        left: rect?.left ?? floatPos.x,
        top: rect?.top ?? floatPos.y,
        axis,
      };
    },
    [floatSize, floatPos],
  );

  const handleResizeMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const start = resizeStartRef.current;
      const card = floatCardRef.current;
      if (!start || !card) {
        return;
      }
      const dx = e.clientX - start.pointerX;
      const dy = e.clientY - start.pointerY;
      let { width, height, left, top } = start;
      if (start.axis !== 'y') {
        width = clamp(
          start.width + dx,
          FLOAT_MIN_WIDTH,
          Math.min(
            FLOAT_MAX_WIDTH,
            window.innerWidth - 2 * FLOAT_VIEWPORT_MARGIN,
          ),
        );
        left = clamp(
          start.left,
          FLOAT_VIEWPORT_MARGIN,
          window.innerWidth - width - FLOAT_VIEWPORT_MARGIN,
        );
      }
      if (start.axis !== 'x') {
        height = clamp(
          start.height + dy,
          FLOAT_MIN_HEIGHT,
          window.innerHeight - 2 * FLOAT_VIEWPORT_MARGIN,
        );
        top = clamp(
          start.top,
          FLOAT_VIEWPORT_MARGIN,
          window.innerHeight - height - FLOAT_VIEWPORT_MARGIN,
        );
      }
      card.style.width = `${width}px`;
      card.style.height = `${height}px`;
      card.style.left = `${left}px`;
      card.style.top = `${top}px`;
      pendingSizeRef.current = { width, height };
      pendingPosRef.current = { x: left, y: top };
    },
    [],
  );

  const endResize = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!resizeStartRef.current) {
      return;
    }
    resizeStartRef.current = null;
    e.currentTarget.releasePointerCapture(e.pointerId);
    const size = pendingSizeRef.current;
    const pos = pendingPosRef.current;
    setFloatSize(size);
    setFloatPos(pos);
    localStorage.setItem(FLOAT_SIZE_STORAGE_KEY, JSON.stringify(size));
    localStorage.setItem(FLOAT_POS_STORAGE_KEY, JSON.stringify(pos));
  }, []);

  // @dnd-kit drives the live drag via a CSS transform on the card; we only fold
  // that delta into the persisted left/top here, on release. restrictToWindowEdges
  // keeps the drag in-bounds, and clampPos is a cheap belt-and-suspenders guard.
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setFloatPos((prev) => {
        const card = floatCardRef.current;
        const next = clampPos(
          { x: prev.x + event.delta.x, y: prev.y + event.delta.y },
          card?.offsetWidth ?? floatSize.width,
          card?.offsetHeight ?? floatSize.height,
        );
        localStorage.setItem(FLOAT_POS_STORAGE_KEY, JSON.stringify(next));
        return next;
      });
    },
    [floatSize],
  );

  // A shrinking viewport (or a stale stored position) could strand the card
  // off-screen — re-clamp it into view whenever the window resizes.
  useEffect(() => {
    if (!floating) {
      return;
    }
    const onResize = () => {
      setFloatPos((prev) => {
        const card = floatCardRef.current;
        const next = clampPos(
          prev,
          card?.offsetWidth ?? floatSize.width,
          card?.offsetHeight ?? floatSize.height,
        );
        if (next.x === prev.x && next.y === prev.y) {
          return prev;
        }
        localStorage.setItem(FLOAT_POS_STORAGE_KEY, JSON.stringify(next));
        return next;
      });
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [floating, floatSize]);

  // Popping out flips the panel to a fixed corner card, which would otherwise
  // teleport. FLIP it: remember where the chat sat while docked, then slide the
  // card from that origin into the corner with a gentle fade. We use a uniform
  // scale that never exceeds 1 — scaling content up (which the old size-ratio
  // FLIP did) painted the text enlarged on the first frame. The panel re-renders
  // rarely (streaming lives in AIChatBox), so measuring here is cheap.
  const dockedRectRef = useRef<DOMRect | null>(null);
  const wasFloatingRef = useRef(floating);
  useLayoutEffect(() => {
    const el = floatCardRef.current;
    if (!el) {
      return;
    }
    const becameFloating = floating && !wasFloatingRef.current;
    wasFloatingRef.current = floating;
    if (!floating) {
      dockedRectRef.current = el.getBoundingClientRect();
      return;
    }
    if (!becameFloating) {
      return;
    }
    const from = dockedRectRef.current;
    const to = el.getBoundingClientRect();
    if (!from || from.width === 0 || to.width === 0) {
      return;
    }
    el.style.transformOrigin = 'top left';
    el.animate(
      [
        {
          transform: `translate(${from.left - to.left}px, ${
            from.top - to.top
          }px) scale(0.96)`,
          opacity: 0,
        },
        { transform: 'translate(0px, 0px) scale(1)', opacity: 1 },
      ],
      { duration: STAGE_TRANSITION_MS, easing: STAGE_TRANSITION_EASING },
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

  const renderHeader = (dragListeners?: DraggableSyntheticListeners) => (
    <div
      {...dragListeners}
      className={cn(
        'shrink-0 flex items-center gap-1.5 px-3 h-12 border-b',
        dragListeners && 'cursor-grab select-none touch-none',
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
      <div
        ref={floatCardRef}
        className="flex h-full overflow-hidden bg-background"
      >
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

  return (
    <DndContext
      sensors={dragSensors}
      modifiers={[restrictToWindowEdges]}
      onDragEnd={handleDragEnd}
    >
      <FloatingChatCard
        cardRef={floatCardRef}
        pos={floatPos}
        size={floatSize}
        onStartResize={startResize}
        onResizeMove={handleResizeMove}
        onEndResize={endResize}
        renderHeader={renderHeader}
      >
        {body}
      </FloatingChatCard>
    </DndContext>
  );
}

// The whole title bar is the drag handle, but it's packed with buttons and the
// rename input — so we only start a drag when the press doesn't land on an
// interactive control. `closest` (not a tag check) is needed because the press
// often lands on an icon `<svg>` nested inside a button.
class ChatDragPointerSensor extends PointerSensor {
  static activators = [
    {
      eventName: 'onPointerDown' as const,
      handler: ({ nativeEvent: event }: React.PointerEvent): boolean => {
        if (!event.isPrimary || event.button !== 0) {
          return false;
        }
        return !(event.target as HTMLElement | null)?.closest(
          'button, input, textarea, select, a, [role="menuitem"], [contenteditable="true"]',
        );
      },
    },
  ];
}

function FloatingChatCard({
  cardRef,
  pos,
  size,
  onStartResize,
  onResizeMove,
  onEndResize,
  renderHeader,
  children,
}: {
  cardRef: React.MutableRefObject<HTMLDivElement | null>;
  pos: { x: number; y: number };
  size: { width: number; height: number };
  onStartResize: (
    axis: 'x' | 'y' | 'both',
  ) => (e: React.PointerEvent<HTMLDivElement>) => void;
  onResizeMove: (e: React.PointerEvent<HTMLDivElement>) => void;
  onEndResize: (e: React.PointerEvent<HTMLDivElement>) => void;
  renderHeader: (
    dragListeners?: DraggableSyntheticListeners,
  ) => React.ReactNode;
  children: React.ReactNode;
}) {
  const { setNodeRef, listeners, transform } = useDraggable({
    id: FLOAT_DRAG_ID,
  });
  // Merge dnd-kit's node ref with the panel's own ref (used by resize + the
  // pop-out FLIP animation).
  const setRefs = useCallback(
    (node: HTMLDivElement | null) => {
      setNodeRef(node);
      cardRef.current = node;
    },
    [setNodeRef, cardRef],
  );
  return (
    <div
      ref={setRefs}
      className="fixed z-50 flex overflow-hidden rounded-xl border bg-background shadow-2xl"
      style={{
        left: pos.x,
        top: pos.y,
        width: size.width,
        height: size.height,
        transform: CSS.Translate.toString(transform),
      }}
    >
      <div
        onPointerDown={onStartResize('x')}
        onPointerMove={onResizeMove}
        onPointerUp={onEndResize}
        onPointerCancel={onEndResize}
        className="absolute inset-y-0 right-0 z-20 w-3 touch-none cursor-ew-resize"
      />
      <div
        onPointerDown={onStartResize('y')}
        onPointerMove={onResizeMove}
        onPointerUp={onEndResize}
        onPointerCancel={onEndResize}
        className="absolute inset-x-0 bottom-0 z-20 h-3 touch-none cursor-ns-resize"
      />
      <div
        onPointerDown={onStartResize('both')}
        onPointerMove={onResizeMove}
        onPointerUp={onEndResize}
        onPointerCancel={onEndResize}
        className="absolute bottom-0 right-0 z-30 h-5 w-5 touch-none cursor-nwse-resize"
      />
      <div className="flex flex-col flex-1 min-w-0 min-h-0 overflow-hidden">
        {renderHeader(listeners)}
        {children}
      </div>
    </div>
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
  const fallback = clampPos(
    {
      x: window.innerWidth - size.width - FLOAT_VIEWPORT_MARGIN,
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
    window.innerWidth - FLOAT_VIEWPORT_MARGIN,
  );
  const maxHeight = window.innerHeight - FLOAT_VIEWPORT_MARGIN;
  const fit = (size: { width: number; height: number }) => ({
    width: clamp(size.width, Math.min(FLOAT_MIN_WIDTH, maxWidth), maxWidth),
    height: clamp(
      size.height,
      Math.min(FLOAT_MIN_HEIGHT, maxHeight),
      maxHeight,
    ),
  });
  const fallback = fit({
    width: FLOAT_DEFAULT_WIDTH,
    height: FLOAT_DEFAULT_HEIGHT,
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
