import { AgentConversation } from '@activepieces/shared';
import { QueryClient, useQuery, useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { Plus, X } from 'lucide-react';
import { memo } from 'react';

import { AIChatBox } from '@/app/routes/chat-with-ai/ai-chat-box';
import { Button } from '@/components/ui/button';
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

export function ChatChrome() {
  const conversationId = useChatPanel((s) => s.conversationId);
  const newChatToken = useChatPanel((s) => s.newChatToken);
  const title = useConversationTitle({ conversationId });

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
            label={t('New chat')}
            onClick={chatPanelUtils.startNewChat}
          >
            <Plus />
          </HeaderButton>
          <HeaderButton
            label={t('Close')}
            onClick={() => useChatPanel.getState().setOpen(false)}
          >
            <X />
          </HeaderButton>
        </div>
      </div>
      <div className="relative min-h-0 flex-1">
        <ChatBody conversationId={conversationId} newChatToken={newChatToken} />
      </div>
    </>
  );
}

const ChatBody = memo(function ChatBody({
  conversationId,
  newChatToken,
}: {
  conversationId: string | null;
  newChatToken: number;
}) {
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient
      .invalidateQueries({ queryKey: chatQueryKeys.allConversationLists() })
      .catch(() => undefined);
  return (
    <AIChatBox
      key={newChatToken}
      incognito={false}
      conversationId={conversationId}
      onConversationCreated={(id) => {
        useChatPanel.getState().conversationCreated(id);
        invalidate();
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
