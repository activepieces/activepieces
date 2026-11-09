import { tryCatch } from '@activepieces/core-utils';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import {
  Ellipsis,
  History,
  Maximize2,
  PanelLeft,
  PanelRight,
  Pencil,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { Tooltip as TooltipPrimitive } from 'radix-ui';
import { memo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { AIChatBox } from '@/app/routes/chat-with-ai/ai-chat-box';
import { ConversationList } from '@/app/routes/chat-with-ai/conversation-list';
import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { chatApi } from '@/features/chat/lib/chat-api';
import { chatUtils } from '@/features/chat/lib/chat-utils';
import {
  chatPanelUtils,
  useChatPanel,
} from '@/features/workspace/lib/chat-panel-open';

import { useActiveConversationId, useChatWidth } from './chat-window';

export function ChatChrome() {
  const layout = useChatWidth();
  const navigate = useNavigate();
  const conversationId = useActiveConversationId();
  const newChatToken = useChatPanel((s) => s.newChatToken);
  const pendingPrompt = useChatPanel((s) => s.pendingPrompt);
  const queryClient = useQueryClient();
  const [liveTitle, setLiveTitle] = useState<LiveTitle | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const renameCancelled = useRef(false);
  const titleInput = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const full = layout === 'full';
  const renaming = renamingId !== null && renamingId === conversationId;
  const setRenaming = (on: boolean) =>
    setRenamingId(on ? conversationId : null);
  const { title, loading: titleLoading } = useConversationTitle({
    conversationId,
    liveTitle: liveTitle?.id === conversationId ? liveTitle.title : null,
  });

  const invalidateList = () =>
    queryClient
      .invalidateQueries({ queryKey: ['chat-conversations'] })
      .catch(() => undefined);

  const openConversation = (id: string) => {
    setHistoryOpen(false);
    if (full) {
      navigate(chatPanelUtils.routeFor(id), { replace: true });
    } else {
      useChatPanel.getState().showConversation(id);
    }
  };

  const startFresh = () => {
    setHistoryOpen(false);
    chatPanelUtils.startNewChat();
    bodyRef.current?.querySelector('textarea')?.focus();
  };

  const finishRename = async (next: string) => {
    setRenaming(false);
    const trimmed = next.trim();
    if (!conversationId || !trimmed || trimmed === title) return;
    const previous = liveTitle;
    setLiveTitle({ id: conversationId, title: trimmed });
    const { error } = await tryCatch(() =>
      chatApi.updateConversation(conversationId, { title: trimmed }),
    );
    if (error) {
      setLiveTitle(previous);
      toast.error(t('Failed to rename conversation'));
      return;
    }
    invalidateList();
  };

  const deleteChat = async () => {
    if (!conversationId) return;
    const id = conversationId;
    startFresh();
    const { error } = await tryCatch(() => chatApi.deleteConversation(id));
    if (error) {
      toast.error(t('Failed to delete conversation'));
      return;
    }
    queryClient.removeQueries({ queryKey: ['chat-conversation', id] });
    invalidateList();
  };

  return (
    <TooltipProvider delayDuration={500} skipDelayDuration={300}>
      <div className="flex h-14 shrink-0 items-center gap-2 pr-2 pl-2.5">
        <div className="flex min-w-0 flex-1 items-center">
          {renaming ? (
            <Input
              ref={titleInput}
              aria-label={t('Chat title')}
              defaultValue={title ?? ''}
              onBlur={(event) => {
                if (renameCancelled.current) {
                  renameCancelled.current = false;
                  setRenaming(false);
                  return;
                }
                finishRename(event.currentTarget.value).catch(() => undefined);
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
                  event.currentTarget.blur();
                }
                if (event.key === 'Escape') {
                  event.preventDefault();
                  renameCancelled.current = true;
                  event.currentTarget.blur();
                }
              }}
              className="h-8 px-1.5 text-sm font-semibold"
            />
          ) : titleLoading ? (
            <Skeleton className="mx-1.5 h-4 w-32" />
          ) : (
            <TextWithTooltip tooltipMessage={title ?? t('New chat')}>
              <h2 className="px-1.5 text-sm font-semibold text-gray-12">
                {title ?? t('New chat')}
              </h2>
            </TextWithTooltip>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          <HeaderButton
            label={t('History')}
            aria-pressed={historyOpen}
            onClick={() => setHistoryOpen(!historyOpen)}
          >
            <History />
          </HeaderButton>
          <HeaderButton
            label={t('New chat')}
            shortcut="⇧⌘O"
            onClick={startFresh}
          >
            <Plus />
          </HeaderButton>
          <LayoutMenu />
          {conversationId && (
            <MoreMenu
              onRename={() => setRenaming(true)}
              renameInput={titleInput}
              onDelete={() => deleteChat().catch(() => undefined)}
            />
          )}
          {!full && (
            <HeaderButton
              label={t('Close')}
              onClick={() => useChatPanel.getState().setOpen(false)}
            >
              <X />
            </HeaderButton>
          )}
        </div>
      </div>
      <div ref={bodyRef} className="relative min-h-0 flex-1">
        {historyOpen && (
          <ConversationList
            className="absolute inset-0 z-10 w-full bg-gray-1 animate-in fade-in duration-150 ease-move motion-reduce:animate-none"
            selectedId={conversationId}
            onSelect={openConversation}
            onNewChat={startFresh}
          />
        )}
        <div inert={historyOpen} className="h-full">
          <ChatBody
            full={full}
            conversationId={conversationId}
            newChatToken={newChatToken}
            prompt={pendingPrompt}
            onLiveTitle={setLiveTitle}
          />
        </div>
      </div>
    </TooltipProvider>
  );
}

const ChatBody = memo(function ChatBody({
  full,
  conversationId,
  newChatToken,
  prompt,
  onLiveTitle,
}: {
  full: boolean;
  conversationId: string | null;
  newChatToken: number;
  prompt?: string;
  onLiveTitle: (title: LiveTitle) => void;
}) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const invalidate = () =>
    queryClient
      .invalidateQueries({ queryKey: ['chat-conversations'] })
      .catch(() => undefined);
  const showOnPage = (id: string | null) => {
    if (full) navigate(chatPanelUtils.routeFor(id), { replace: true });
  };
  return (
    <AIChatBox
      key={newChatToken}
      incognito={false}
      compact={!full}
      conversationId={conversationId}
      initialPrompt={prompt}
      onConversationCreated={(id) => {
        useChatPanel.getState().conversationCreated(id);
        showOnPage(id);
        invalidate();
      }}
      onConversationMissing={() => {
        useChatPanel.getState().conversationMissing();
        showOnPage(null);
      }}
      onTitleUpdate={(next) => {
        const id = useChatPanel.getState().conversationId;
        if (id) onLiveTitle({ id, title: next });
        invalidate();
      }}
    />
  );
});

function useConversationTitle({
  conversationId,
  liveTitle,
}: {
  conversationId: string | null;
  liveTitle: string | null;
}): { title: string | null; loading: boolean } {
  const { data, isLoading } = useQuery({
    queryKey: ['chat-conversation', conversationId],
    queryFn: () =>
      conversationId ? chatApi.getConversation(conversationId) : null,
    enabled: !!conversationId && !liveTitle,
    staleTime: Infinity,
  });
  const title = liveTitle ?? data?.title ?? null;
  return {
    title: title ? chatUtils.sanitizeTitle(title) : null,
    loading: isLoading,
  };
}

function LayoutMenu() {
  const layout = useChatWidth();
  const mode = useChatPanel((s) => s.mode);
  const current = layout === 'full' ? 'full' : mode;
  const Icon =
    current === 'full'
      ? Maximize2
      : current === 'left'
      ? PanelLeft
      : PanelRight;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <HeaderButton label={t('Chat layout')}>
          <Icon />
        </HeaderButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-44"
        onCloseAutoFocus={(event) => event.preventDefault()}
      >
        <DropdownMenuRadioGroup
          value={current}
          onValueChange={(value) => {
            if (value === current) return;
            if (value === 'full') {
              chatPanelUtils.expand();
            } else if (value === 'left' || value === 'right') {
              chatPanelUtils.collapse(value);
            }
          }}
        >
          <DropdownMenuRadioItem value="left">
            <PanelLeft className="size-4" />
            {t('On the left')}
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="right">
            <PanelRight className="size-4" />
            {t('On the right')}
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="full">
            <Maximize2 className="size-4" />
            {t('Full page')}
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MoreMenu({
  onRename,
  renameInput,
  onDelete,
}: {
  onRename: () => void;
  renameInput: React.RefObject<HTMLInputElement | null>;
  onDelete: () => void;
}) {
  const renameChosen = useRef(false);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <HeaderButton label={t('More')}>
          <Ellipsis />
        </HeaderButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-44"
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          if (!renameChosen.current) return;
          renameChosen.current = false;
          renameInput.current?.focus();
        }}
      >
        <DropdownMenuItem
          onSelect={() => {
            renameChosen.current = true;
            onRename();
          }}
        >
          <Pencil className="size-4" />
          {t('Rename')}
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={onDelete}
          className="text-danger-11 focus:text-danger-11"
        >
          <Trash2 className="size-4" />
          {t('Delete')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function HeaderButton({
  label,
  shortcut,
  children,
  ...props
}: React.ComponentProps<typeof Button> & { label: string; shortcut?: string }) {
  return (
    <TooltipPrimitive.Root>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={label}
          className="text-gray-11 hover:text-gray-12 aria-pressed:bg-gray-4 aria-pressed:text-gray-12 data-[state=open]:bg-gray-4 data-[state=open]:text-gray-12"
          {...props}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent
        side="bottom"
        sideOffset={4}
        className="flex items-center gap-2"
      >
        {label}
        {shortcut && <span className="text-xs opacity-50">{shortcut}</span>}
      </TooltipContent>
    </TooltipPrimitive.Root>
  );
}

type LiveTitle = { id: string; title: string };
