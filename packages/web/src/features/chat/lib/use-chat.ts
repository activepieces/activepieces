import {
  type ChatConversation,
  ChatStreamEventType,
} from '@activepieces/shared';
import { useCallback, useEffect, useRef, useState } from 'react';

import { chatApi, type ChatStreamEvent } from './chat-api';

export type ChatMessageItem = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolCalls: ToolCallItem[];
  timestamp: number;
};

export type ToolCallItem = {
  id: string;
  name: string;
  status: 'running' | 'completed' | 'failed';
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
};

function safeString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

export function useAgentChat() {
  const [conversation, setConversation] = useState<
    ChatConversation | { id: string } | null
  >(null);
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const messageIdCounter = useRef(0);

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
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id !== assistantId) return msg;

          switch (event.type) {
            case ChatStreamEventType.TEXT_CHUNK:
              return {
                ...msg,
                content: msg.content + safeString(event.data.text),
              };

            case ChatStreamEventType.TOOL_CALL_START:
              return {
                ...msg,
                toolCalls: [
                  ...msg.toolCalls,
                  {
                    id:
                      safeString(event.data.toolCallId) ||
                      safeString(event.data.id) ||
                      `tc-${Date.now()}`,
                    name:
                      safeString(event.data.toolName) ||
                      safeString(event.data.name) ||
                      'Unknown tool',
                    status: 'running' as const,
                  },
                ],
              };

            case ChatStreamEventType.TOOL_CALL_UPDATE:
            case ChatStreamEventType.TOOL_CALL_COMPLETE: {
              const tcId =
                safeString(event.data.toolCallId) || safeString(event.data.id);
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
                      }
                    : tc,
                ),
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

      const userMessage: ChatMessageItem = {
        id: nextMessageId(),
        role: 'user',
        content,
        toolCalls: [],
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMessage]);

      const assistantId = nextMessageId();
      const assistantMessage: ChatMessageItem = {
        id: assistantId,
        role: 'assistant',
        content: '',
        toolCalls: [],
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsStreaming(true);

      let conv = conversation;
      if (!conv) {
        try {
          conv = await createConversation(content.slice(0, 100));
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
      setConversation({ id: conversationId });
      setMessages([]);
      setError(null);
      messageIdCounter.current = 0;

      setIsLoadingHistory(true);
      try {
        const { data } = await chatApi.getMessages(conversationId);
        const loadedMessages: ChatMessageItem[] = data.map((msg) => ({
          id: nextMessageId(),
          role: msg.role,
          content: msg.content,
          toolCalls: [],
          timestamp: Date.now(),
        }));
        setMessages(loadedMessages);
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
    isLoadingHistory,
    error,
    sendMessage,
    cancelStream,
    resetChat,
    createConversation,
    setConversationId,
  };
}
