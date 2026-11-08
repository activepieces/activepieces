import { QueryClient, keepPreviousData, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { chatApi } from './chat-api';
import { ChatUIMessage } from './chat-types';
import { chatUtils } from './chat-utils';
import { useFollowAlong } from './follow/follow-along';
import {
  ChangeLine,
  ToolCallRecord,
  changeSummaryUtils,
} from './resources/change-summary';

export function useConversationChanges(
  conversationId: string | null,
): ChangeLine[] {
  const runs = useFollowAlong((state) => state.runs);
  const liveCalls = useMemo(
    () =>
      Object.values(runs)
        .filter((run) => run.conversationId === conversationId)
        .flatMap((run) => run.changes.map(toToolCall)),
    [runs, conversationId],
  );
  const { data: savedCalls } = useQuery({
    queryKey: savedCallsKey(conversationId),
    queryFn: async () => {
      if (!conversationId) return [];
      const result = await chatApi.getMessages(conversationId);
      return callsIn(chatUtils.mapHistoryToUIMessages(result.data));
    },
    enabled: conversationId !== null,
    staleTime: Infinity,
    placeholderData: keepPreviousData,
  });
  return useMemo(
    () =>
      changeSummaryUtils
        .summarize([...(savedCalls ?? []), ...liveCalls])
        .filter((line) => line.state === 'applied' || line.state === 'partial'),
    [savedCalls, liveCalls],
  );
}

function seed({
  queryClient,
  conversationId,
  messages,
}: {
  queryClient: QueryClient;
  conversationId: string;
  messages: ChatUIMessage[];
}): void {
  queryClient.setQueryData(savedCallsKey(conversationId), callsIn(messages));
}

function savedCallsKey(conversationId: string | null) {
  return ['chat-conversation-changes', conversationId];
}

function callsIn(messages: ChatUIMessage[]): ToolCallRecord[] {
  return messages
    .filter((message) => message.role === 'assistant')
    .flatMap((message) => changeSummaryUtils.fromToolParts(message.parts));
}

function toToolCall({
  toolCallId,
  toolName,
  input,
  output,
}: {
  toolCallId: string;
  toolName: string;
  input: unknown;
  output: unknown;
}): ToolCallRecord {
  return { toolCallId, toolName, input, output, state: 'output-available' };
}

export const conversationChanges = { seed };
