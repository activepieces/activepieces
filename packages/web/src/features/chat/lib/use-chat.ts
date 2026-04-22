import {
  type ChatConversation,
  type ChatHistoryMessage,
  ChatStreamEventType,
} from '@activepieces/shared';
import { useCallback, useEffect, useRef, useState } from 'react';

import { chatApi, type ChatStreamEvent } from './chat-api';

function safeString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function mapHistoryToMessages({
  data,
  nextMessageId,
}: {
  data: ChatHistoryMessage[];
  nextMessageId: () => string;
}): ChatMessageItem[] {
  return data.map((msg) => ({
    id: nextMessageId(),
    role: msg.role,
    content: msg.content,
    thoughts: msg.thoughts ?? '',
    plan: null,
    toolCalls:
      msg.toolCalls?.map((tc) => ({
        id: tc.toolCallId,
        name: tc.title,
        title: tc.title,
        status: (tc.status === 'completed' ? 'completed' : 'failed') as
          | 'running'
          | 'completed'
          | 'failed',
        input: tc.input,
        output: tc.output,
      })) ?? [],
    timestamp: Date.now(),
  }));
}

export function useAgentChat({
  onTitleUpdate,
  onConversationCreated,
}: {
  onTitleUpdate?: (title: string) => void;
  onConversationCreated?: () => void;
} = {}) {
  const [conversation, setConversation] = useState<
    ChatConversation | { id: string } | null
  >(null);
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [wasCancelled, setWasCancelled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const messageIdCounter = useRef(0);
  const onTitleUpdateRef = useRef(onTitleUpdate);
  onTitleUpdateRef.current = onTitleUpdate;
  const onConversationCreatedRef = useRef(onConversationCreated);
  onConversationCreatedRef.current = onConversationCreated;

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const nextMessageId = useCallback(() => {
    messageIdCounter.current += 1;
    return `msg-${messageIdCounter.current}`;
  }, []);

  const createConversation = useCallback(
    async (title?: string, modelName?: string) => {
      const conv = await chatApi.createConversation({
        title: title ?? null,
        modelName: modelName ?? null,
      });
      setConversation(conv);
      return conv;
    },
    [],
  );

  const handleStreamEvent = useCallback(
    (assistantId: string, event: ChatStreamEvent) => {
      if (event.type === ChatStreamEventType.SESSION_TITLE_UPDATE) {
        const title = safeString(event.data.title);
        if (title) {
          onTitleUpdateRef.current?.(title);
        }
        return;
      }

      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id !== assistantId) return msg;

          switch (event.type) {
            case ChatStreamEventType.TEXT_CHUNK:
              return {
                ...msg,
                content: msg.content + safeString(event.data.text),
              };

            case ChatStreamEventType.THOUGHT_CHUNK:
              return {
                ...msg,
                thoughts: msg.thoughts + safeString(event.data.text),
              };

            case ChatStreamEventType.TOOL_CALL_START:
              return {
                ...msg,
                toolCalls: [
                  ...msg.toolCalls,
                  {
                    id: safeString(event.data.toolCallId) || `tc-${Date.now()}`,
                    name: safeString(event.data.toolName) || 'Unknown tool',
                    title: safeString(event.data.title),
                    status: 'running' as const,
                    kind: safeString(event.data.kind) || undefined,
                    input: isRecord(event.data.rawInput)
                      ? (event.data.rawInput as Record<string, unknown>)
                      : undefined,
                  },
                ],
              };

            case ChatStreamEventType.TOOL_CALL_UPDATE:
            case ChatStreamEventType.TOOL_CALL_COMPLETE: {
              const tcId = safeString(event.data.toolCallId);
              if (!tcId) return msg;
              return {
                ...msg,
                toolCalls: msg.toolCalls.map((tc) =>
                  tc.id === tcId
                    ? {
                        ...tc,
                        status:
                          event.type === ChatStreamEventType.TOOL_CALL_COMPLETE
                            ? ('completed' as const)
                            : tc.status,
                        output: safeString(event.data.output) || tc.output,
                        title: safeString(event.data.title) || tc.title,
                      }
                    : tc,
                ),
              };
            }

            case ChatStreamEventType.PLAN_UPDATE: {
              const entries = event.data.entries;
              if (!Array.isArray(entries)) return msg;
              return {
                ...msg,
                plan: entries.filter(isRecord).map((entry) => ({
                  content: safeString(entry.content),
                  status: safeString(
                    entry.status,
                    'pending',
                  ) as PlanItem['status'],
                })),
              };
            }

            default:
              return msg;
          }
        }),
      );
    },
    [],
  );

  const sendMessage = useCallback(
    async (content: string) => {
      setError(null);
      setWasCancelled(false);

      const userMessage: ChatMessageItem = {
        id: nextMessageId(),
        role: 'user',
        content,
        thoughts: '',
        plan: null,
        toolCalls: [],
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMessage]);

      const assistantId = nextMessageId();
      const assistantMessage: ChatMessageItem = {
        id: assistantId,
        role: 'assistant',
        content: '',
        thoughts: '',
        plan: null,
        toolCalls: [],
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsStreaming(true);

      let conv = conversation;
      if (!conv) {
        try {
          conv = await createConversation(content.slice(0, 100));
          onConversationCreatedRef.current?.();
        } catch (err) {
          setError(
            err instanceof Error ? err.message : 'Failed to start conversation',
          );
          setIsStreaming(false);
          setMessages((prev) => prev.filter((m) => m.id !== assistantId));
          return;
        }
      }

      const controller = chatApi.sendMessage(
        conv.id,
        { content },
        (event: ChatStreamEvent) => {
          handleStreamEvent(assistantId, event);
        },
        () => {
          setIsStreaming(false);
        },
        (errMsg: string) => {
          setError(errMsg);
          setIsStreaming(false);
        },
      );

      abortRef.current = controller;
    },
    [conversation, createConversation, nextMessageId, handleStreamEvent],
  );

  const cancelStream = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
      setIsStreaming(false);
      setWasCancelled(true);
    }
  }, []);

  const resetChat = useCallback(() => {
    cancelStream();
    setConversation(null);
    setMessages([]);
    setError(null);
    messageIdCounter.current = 0;
  }, [cancelStream]);

  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const setConversationId = useCallback(
    async (conversationId: string) => {
      cancelStream();
      setWasCancelled(false);
      setConversation({ id: conversationId });
      setMessages([]);
      setError(null);
      messageIdCounter.current = 0;

      setIsLoadingHistory(true);
      try {
        const { data } = await chatApi.getMessages(conversationId);
        setMessages(mapHistoryToMessages({ data, nextMessageId }));
      } catch {
        setError('Failed to load conversation history');
      } finally {
        setIsLoadingHistory(false);
      }
    },
    [cancelStream, nextMessageId],
  );

  return {
    conversation,
    messages,
    isStreaming,
    wasCancelled,
    isLoadingHistory,
    error,
    sendMessage,
    cancelStream,
    resetChat,
    createConversation,
    setConversationId,
  };
}

export type ChatMessageItem = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  thoughts: string;
  plan: PlanItem[] | null;
  toolCalls: ToolCallItem[];
  timestamp: number;
};

export type ToolCallItem = {
  id: string;
  name: string;
  title: string;
  status: 'running' | 'completed' | 'failed';
  kind?: string;
  input?: Record<string, unknown>;
  output?: string;
};

export type PlanItem = {
  content: string;
  status: 'pending' | 'in_progress' | 'completed';
};
