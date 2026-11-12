import { useQuery, useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { Maximize2, PanelLeft, PanelRight, Plus, X } from 'lucide-react';
import { memo } from 'react';

import { AIChatBox } from '@/app/routes/chat-with-ai/ai-chat-box';
import { useEmbedding } from '@/components/providers/embed-provider';
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
  const full = layout === 'full';

  const phone = windowSizeHooks.useIsPhone();
  const embedded = useEmbedding().embedState.isEmbedded;

  const startFresh = () => {
    chatPanelUtils.startNewChat();
  };

  return (
    <>
      <div
        data-chat-header
        className="relative flex h-14 shrink-0 items-center gap-2 pr-3 pl-1 @chat-sm/chat:pl-4"
      >
        <div className="flex min-w-0 flex-1 items-center">
          <ChatTitle conversationId={conversationId} />
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          <HeaderButton label={t('New chat')} onClick={startFresh}>
            <Plus />
          </HeaderButton>
          {!phone && !embedded && <LayoutMenu />}
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
        <div className="h-full">
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
      onTitleUpdate={() => {
        const id = useChatPanel.getState().conversationId;
        if (id) {
          queryClient
            .invalidateQueries({ queryKey: chatQueryKeys.conversation(id) })
            .catch(() => undefined);
        }
        invalidate();
      }}
    />
  );
});

function LayoutMenu() {
  const layout = useChatWidth();
  const mode = useChatPanel((s) => s.mode);
  const current = layout === 'full' ? 'full' : mode;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <HeaderButton label={t('Chat layout')}>
          <PanelLeft />
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

function ChatTitle({ conversationId }: { conversationId: string | null }) {
  const { data } = useQuery({
    queryKey: chatQueryKeys.conversation(conversationId),
    queryFn: () =>
      conversationId ? chatApi.getConversation(conversationId) : null,
    enabled: !!conversationId,
    staleTime: Infinity,
  });
  return (
    <h2 className="truncate px-2 text-sm font-medium text-gray-12">
      {chatUtils.displayTitle(data?.title)}
    </h2>
  );
}

function HeaderButton({
  label,
  children,
  ...props
}: React.ComponentProps<typeof Button> & {
  label: string;
}) {
  return (
    <Tooltip delayDuration={HEADER_TOOLTIP_DELAY_MS}>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={label}
          className="text-gray-11 transition-colors duration-(--dur-micro) ease-[ease] hover:text-gray-12 active:bg-gray-5 aria-pressed:bg-gray-4 aria-pressed:text-gray-12 data-[state=open]:bg-gray-4 data-[state=open]:text-gray-12"
          {...props}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent
        side="bottom"
        sideOffset={4}
        className="pointer-events-none flex items-center gap-2"
      >
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

const HEADER_TOOLTIP_DELAY_MS = 500;
