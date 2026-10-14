import { useQuery } from '@tanstack/react-query';
import { t } from 'i18next';
import { SquarePen, X } from 'lucide-react';
import { useMemo, useState } from 'react';

import { AIChatBox } from '@/app/routes/chat-with-ai/ai-chat-box';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { chatApi } from '@/features/chat/lib/chat-api';
import { ChatFlowContext } from '@/features/chat/lib/use-chat';

import { useBuilderStateContext, useBuilderStore } from '../builder-hooks';

export function BuilderChatPanel() {
  const store = useBuilderStore();
  const [flowId, setBuilderChatOpen] = useBuilderStateContext((state) => [
    state.flow.id,
    state.setBuilderChatOpen,
  ]);
  const [freshSession, setFreshSession] = useState(0);

  const { data: latestConversationId, isLoading } = useQuery({
    queryKey: ['builder-chat-conversation', flowId],
    queryFn: async () => {
      const page = await chatApi.listConversations({ flowId, limit: 1 });
      return page.data[0]?.id ?? null;
    },
    staleTime: Infinity,
  });

  const flowContext: ChatFlowContext = useMemo(
    () => ({
      flowId,
      getSelectedStepName: () => store.getState().selectedStep,
    }),
    [flowId, store],
  );

  return (
    <div className="flex h-full w-full flex-col border-r bg-gray-1">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <span className="text-sm font-medium">{t('Chat')}</span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label={t('New chat')}
            onClick={() => setFreshSession((session) => session + 1)}
          >
            <SquarePen className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label={t('Close')}
            onClick={() => setBuilderChatOpen(false)}
          >
            <X className="size-4" />
          </Button>
        </div>
      </div>
      <div className="flex min-h-0 grow flex-col">
        {isLoading ? (
          <div className="flex flex-col gap-2 p-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-2/3" />
          </div>
        ) : (
          <AIChatBox
            key={`${flowId}-${freshSession}`}
            incognito={false}
            conversationId={freshSession === 0 ? latestConversationId : null}
            flowContext={flowContext}
            placeholder={t('Ask chat to build or change this flow...')}
          />
        )}
      </div>
    </div>
  );
}
