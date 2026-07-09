import {
  ChatAgentEventType,
  ChatConversation,
  ChatConversationStatus,
  WebsocketClientEvent,
} from '@activepieces/shared';
import { useQueries, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useSocket } from '@/components/providers/socket-provider';

import { chatApi } from './chat-api';

export function useConversationIndicators({
  conversations,
  activeId,
}: {
  conversations: ChatConversation[];
  activeId: string | null;
}) {
  const socket = useSocket();
  const queryClient = useQueryClient();
  const [lastSeen, setLastSeen] = useState<Record<string, string>>(() =>
    readLastSeen(),
  );

  const conversationsRef = useRef(conversations);
  conversationsRef.current = conversations;

  useEffect(() => {
    if (conversations.length === 0) return;
    setLastSeen((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const conv of conversations) {
        if (next[conv.id] === undefined) {
          next[conv.id] = conv.updated;
          changed = true;
        }
      }
      if (!changed) return prev;
      writeLastSeen(next);
      return next;
    });
  }, [conversations]);

  const markRead = useCallback((id: string) => {
    const conv = conversationsRef.current.find((c) => c.id === id);
    const seenValue = conv?.updated ?? new Date().toISOString();
    setLastSeen((prev) => {
      if (prev[id] === seenValue) return prev;
      const next = { ...prev, [id]: seenValue };
      writeLastSeen(next);
      return next;
    });
  }, []);

  const activeUpdated = activeId
    ? conversations.find((c) => c.id === activeId)?.updated
    : undefined;
  useEffect(() => {
    if (activeId) markRead(activeId);
  }, [activeId, activeUpdated, markRead]);

  useEffect(() => {
    const knownStreaming = new Set<string>();

    const invalidateList = () => {
      void queryClient.invalidateQueries({ queryKey: ['chat-conversations'] });
    };

    const handler = (event: SocketEvent) => {
      const convId = event.conversationId;
      if (!convId) return;
      switch (event.type) {
        case ChatAgentEventType.FINISHED:
        case ChatAgentEventType.ERROR:
          knownStreaming.delete(convId);
          invalidateList();
          break;
        case ChatAgentEventType.ACTION_PREVIEW:
        case ChatAgentEventType.ACTION_RECEIPT:
          void queryClient.invalidateQueries({
            queryKey: ['chat-pending-gate', convId],
          });
          invalidateList();
          break;
        case ChatAgentEventType.CHUNK:
        case ChatAgentEventType.TITLE_UPDATE:
          if (!knownStreaming.has(convId)) {
            knownStreaming.add(convId);
            invalidateList();
          }
          break;
        default:
          break;
      }
    };

    socket.on(WebsocketClientEvent.CHAT_MESSAGE_CHUNK, handler);
    const reconnectHandler = () => {
      socket.off(WebsocketClientEvent.CHAT_MESSAGE_CHUNK, handler);
      socket.on(WebsocketClientEvent.CHAT_MESSAGE_CHUNK, handler);
    };
    socket.on('connect', reconnectHandler);

    return () => {
      socket.off(WebsocketClientEvent.CHAT_MESSAGE_CHUNK, handler);
      socket.off('connect', reconnectHandler);
    };
  }, [socket, queryClient]);

  const streamingIds = useMemo(
    () =>
      conversations
        .filter((c) => c.status === ChatConversationStatus.STREAMING)
        .map((c) => c.id),
    [conversations],
  );

  const gateQueries = useQueries({
    queries: streamingIds.map((id) => ({
      queryKey: ['chat-pending-gate', id],
      queryFn: () => chatApi.getPendingGate(id),
      refetchInterval: GATE_REFETCH_INTERVAL_MS,
    })),
  });

  const waitingSet = useMemo(() => {
    const set = new Set<string>();
    streamingIds.forEach((id, index) => {
      if (gateQueries[index]?.data) set.add(id);
    });
    return set;
  }, [streamingIds, gateQueries]);

  const getIndicator = useCallback(
    (conv: ChatConversation): ConversationIndicatorState | null => {
      if (conv.status === ChatConversationStatus.STREAMING) {
        return waitingSet.has(conv.id) ? 'waiting' : 'working';
      }
      if (conv.id !== activeId) {
        const seen = lastSeen[conv.id];
        if (seen !== undefined && conv.updated > seen) return 'unread';
      }
      return null;
    },
    [waitingSet, activeId, lastSeen],
  );

  return { getIndicator, markRead };
}

function readLastSeen(): Record<string, string> {
  try {
    const raw = localStorage.getItem(LAST_SEEN_STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return {};
    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === 'string') result[key] = value;
    }
    return result;
  } catch {
    return {};
  }
}

function writeLastSeen(value: Record<string, string>): void {
  try {
    localStorage.setItem(LAST_SEEN_STORAGE_KEY, JSON.stringify(value));
  } catch {
    // localStorage may be unavailable (private mode / quota) — unread falls back to in-memory.
  }
}

const LAST_SEEN_STORAGE_KEY = 'chat-conversation-last-seen';
const GATE_REFETCH_INTERVAL_MS = 3000;

type SocketEvent = {
  conversationId: string;
  runId?: string;
  type: string;
  data: unknown;
};

export type ConversationIndicatorState = 'working' | 'waiting' | 'unread';
