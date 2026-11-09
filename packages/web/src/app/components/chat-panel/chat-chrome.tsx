import { AgentConversation } from '@activepieces/shared';
import { QueryClient, useQuery, useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import {
  History,
  Maximize2,
  PanelLeft,
  PanelRight,
  Plus,
  X,
} from 'lucide-react';
import { memo, useState } from 'react';

import { AIChatBox } from '@/app/routes/chat-with-ai/ai-chat-box';
import { ConversationList } from '@/app/routes/chat-with-ai/conversation-list';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { chatApi } from '@/features/chat/lib/chat-api';
import { chatQueryKeys } from '@/features/chat/lib/chat-query-keys';
import { chatUtils } from '@/features/chat/lib/chat-utils';
import {
  chatPanelUtils,
  useChatPanel,
} from '@/features/workspace/lib/chat-panel-open';
import { windowSizeHooks } from '@/features/workspace/lib/window-size-hooks';

import { useActiveConversationId, useChatWidth } from './chat-window';

export function ChatChrome() {
  const layout = useChatWidth();
  const conversationId = useActiveConversationId();
  const newChatToken = useChatPanel((s) => s.newChatToken);
  const pendingPrompt = useChatPanel((s) => s.pendingPrompt);
  const [historyOpen, setHistoryOpen] = useState(false);
  const full = layout === 'full';
  const chatShown = layout !== 'closed';

  if (!chatShown && historyOpen) {
    setHistoryOpen(false);
  }

  const phone = windowSizeHooks.useIsPhone();
  const title = useConversationTitle({ conversationId });

  const openConversation = (id: string) => {
    setHistoryOpen(false);
    if (full) {
      chatPanelUtils.showOnFullPage(id);
    } else {
      useChatPanel.getState().showConversation(id);
    }
  };

  const startFresh = () => {
    setHistoryOpen(false);
    chatPanelUtils.startNewChat();
  };

  return (
    <>
      <div
        data-chat-header
        className="relative flex h-14 shrink-0 items-center gap-2 pr-3 pl-4"
      >
        <h2
          title={title ?? undefined}
          className="min-w-0 flex-1 truncate text-sm font-semibold text-gray-12"
        >
          {title ?? t('New chat')}
        </h2>
        <div className="-mr-1 flex shrink-0 items-center gap-0.5">
          <HeaderButton
            label={historyOpen ? t('Hide history') : t('History')}
            aria-pressed={historyOpen}
            onClick={() => setHistoryOpen(!historyOpen)}
          >
            <History />
          </HeaderButton>
          <HeaderButton label={t('New chat')} onClick={startFresh}>
            <Plus />
          </HeaderButton>
          {!phone && <LayoutMenu />}
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
      <div className="relative min-h-0 flex-1">
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
          />
        </div>
      </div>
    </>
  );
}

const ChatBody = memo(function ChatBody({
  full,
  conversationId,
  newChatToken,
  prompt,
}: {
  full: boolean;
  conversationId: string | null;
  newChatToken: number;
  prompt?: string;
}) {
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient
      .invalidateQueries({ queryKey: chatQueryKeys.allConversationLists() })
      .catch(() => undefined);
  const showOnPage = (id: string | null) => {
    if (full) chatPanelUtils.showOnFullPage(id);
  };
  return (
    <AIChatBox
      key={newChatToken}
      incognito={false}
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
        if (id) {
          setCachedTitle({ queryClient, conversationId: id, title: next });
        }
        invalidate();
      }}
    />
  );
});

function useConversationTitle({
  conversationId,
}: {
  conversationId: string | null;
}): string | null {
  const { data } = useQuery({
    queryKey: chatQueryKeys.conversation(conversationId),
    queryFn: () =>
      conversationId ? chatApi.getConversation(conversationId) : null,
    enabled: !!conversationId,
    staleTime: Infinity,
  });
  const title = data?.title ?? null;
  return title ? chatUtils.sanitizeTitle(title) : null;
}

function setCachedTitle({
  queryClient,
  conversationId,
  title,
}: {
  queryClient: QueryClient;
  conversationId: string;
  title: string;
}): void {
  const key = chatQueryKeys.conversation(conversationId);
  const cached = queryClient.getQueryData<AgentConversation | null>(key);
  if (!cached) {
    queryClient.invalidateQueries({ queryKey: key }).catch(() => undefined);
    return;
  }
  queryClient.setQueryData<AgentConversation | null>(key, {
    ...cached,
    title,
  });
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

function HeaderButton({
  label,
  children,
  ...props
}: React.ComponentProps<typeof Button> & { label: string }) {
  return (
    <Tooltip delayDuration={HEADER_TOOLTIP_DELAY_MS}>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={label}
          className="text-gray-11 transition-colors duration-150 hover:text-gray-12 active:bg-gray-5 aria-pressed:bg-gray-4 aria-pressed:text-gray-12 data-[state=open]:bg-gray-4 data-[state=open]:text-gray-12"
          {...props}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent
        side="bottom"
        sideOffset={4}
        className="pointer-events-none"
      >
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

const HEADER_TOOLTIP_DELAY_MS = 500;
