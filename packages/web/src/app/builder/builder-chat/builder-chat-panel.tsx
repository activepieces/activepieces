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

import { useToggleBuilderChat } from './use-toggle-builder-chat';

export function BuilderChatPanel() {
  const store = useBuilderStore();
  const flowId = useBuilderStateContext((state) => state.flow.id);
  const toggleBuilderChat = useToggleBuilderChat();
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
            onClick={() => toggleBuilderChat(false)}
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
            emptyState={<BuilderChatEmptyState />}
          />
        )}
      </div>
    </div>
  );
}

function BuilderChatEmptyState() {
  return (
    <div className="flex h-full flex-col justify-end gap-1 p-4">
      <p className="text-sm font-medium">{t('Build this flow with chat')}</p>
      <p className="text-sm text-gray-11">
        {t(
          'Describe what it should do. You can keep editing the canvas while chat works, and it will see your changes.',
        )}
      </p>
    </div>
  );
}
