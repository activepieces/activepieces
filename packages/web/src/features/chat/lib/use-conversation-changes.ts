import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { chatApi } from './chat-api';
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
    queryKey: ['chat-conversation-changes', conversationId],
    queryFn: async () => {
      if (!conversationId) return [];
      const result = await chatApi.getMessages(conversationId);
      return chatUtils
        .mapHistoryToUIMessages(result.data)
        .filter((message) => message.role === 'assistant')
        .flatMap((message) => changeSummaryUtils.fromToolParts(message.parts));
    },
    enabled: conversationId !== null,
    staleTime: 0,
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
