import { QueryClient, useQuery } from '@tanstack/react-query';

import { chatApi } from './chat-api';
import { ChatUIMessage } from './chat-types';
import { chatUtils } from './chat-utils';
import { Change, changeSummary } from './resources/change-summary';

export function useConversationChanges(conversationId: string) {
  return useQuery({
    queryKey: changesKey(conversationId),
    queryFn: async () => {
      const { data } = await chatApi.getMessages(conversationId);
      return changeSummary.fromMessages(chatUtils.mapHistoryToUIMessages(data));
    },
    staleTime: Infinity,
  });
}

function seed({
  queryClient,
  conversationId,
  messages,
}: {
  queryClient: QueryClient;
  conversationId: string;
  messages: readonly ChatUIMessage[];
}): void {
  queryClient.setQueryData<Change[]>(
    changesKey(conversationId),
    changeSummary.fromMessages(messages),
  );
}

function changesKey(conversationId: string) {
  return ['chat-conversation-changes', conversationId];
}

export const conversationChanges = { seed };
