import { GetChatMemoryResponse } from '@activepieces/shared';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { chatApi } from '@/features/chat/lib/chat-api';

const CHAT_MEMORY_QUERY_KEY = ['chat-memory'];

export function useChatMemory() {
  return useQuery({
    queryKey: CHAT_MEMORY_QUERY_KEY,
    queryFn: chatApi.getMemory,
  });
}

export function useChatMemoryActions() {
  const queryClient = useQueryClient();
  return {
    invalidate: () =>
      queryClient.invalidateQueries({ queryKey: CHAT_MEMORY_QUERY_KEY }),
    currentMemories: () =>
      queryClient.getQueryData<GetChatMemoryResponse>(CHAT_MEMORY_QUERY_KEY)
        ?.memories ?? [],
  };
}
