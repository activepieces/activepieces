import {
  CHAT_ALLOWED_MIME_TYPES,
  type ChatAllowedMimeType,
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
  return data.map((msg) => {
    const blocks: MessageBlock[] = [];
    if (msg.content) {
      blocks.push({ type: 'text', text: msg.content });
    }
    if (msg.toolCalls && msg.toolCalls.length > 0) {
      blocks.push({
        type: 'tool_calls',
        calls: msg.toolCalls.map((tc) => ({
          id: tc.toolCallId,
          name: tc.title,
          title: tc.title,
          status: (tc.status === 'completed' ? 'completed' : 'failed') as
            | 'running'
            | 'completed'
            | 'failed',
          input: tc.input,
          output: tc.output,
        })),
      });
    }
    return {
      id: nextMessageId(),
      role: msg.role,
      blocks,
      thoughts: msg.thoughts ?? '',
      plan: null,
      fileNames: [],
      timestamp: Date.now(),
    };
  });
}

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_MIME_SET: ReadonlySet<string> = new Set(CHAT_ALLOWED_MIME_TYPES);

function isAllowedMimeType(value: string): value is ChatAllowedMimeType {
  return ALLOWED_MIME_SET.has(value);
}

function fileToBase64(
  file: File,
): Promise<{ name: string; mimeType: ChatAllowedMimeType; data: string }> {
  return new Promise((resolve, reject) => {
    const mimeType = file.type || 'application/octet-stream';
    if (!isAllowedMimeType(mimeType)) {
      reject(new Error(`Unsupported file type: ${mimeType}`));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve({ name: file.name, mimeType, data: base64 });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function appendTextToBlocks(
  blocks: MessageBlock[],
  text: string,
): MessageBlock[] {
  const last = blocks[blocks.length - 1];
  if (last && last.type === 'text') {
    return [...blocks.slice(0, -1), { type: 'text', text: last.text + text }];
  }
  return [...blocks, { type: 'text', text }];
}

function appendToolCallToBlocks(
  blocks: MessageBlock[],
  call: ToolCallItem,
): MessageBlock[] {
  const last = blocks[blocks.length - 1];
  if (last && last.type === 'tool_calls') {
    return [
      ...blocks.slice(0, -1),
      { type: 'tool_calls', calls: [...last.calls, call] },
    ];
  }
  return [...blocks, { type: 'tool_calls', calls: [call] }];
}

function updateToolCallInBlocks(
  blocks: MessageBlock[],
  toolCallId: string,
  updater: (tc: ToolCallItem) => ToolCallItem,
): MessageBlock[] {
  return blocks.map((block) => {
    if (block.type !== 'tool_calls') return block;
    const hasMatch = block.calls.some((tc) => tc.id === toolCallId);
    if (!hasMatch) return block;
    return {
      ...block,
      calls: block.calls.map((tc) => (tc.id === toolCallId ? updater(tc) : tc)),
    };
  });
}

function stopRunningToolsInBlocks(blocks: MessageBlock[]): MessageBlock[] {
  return blocks.map((block) => {
    if (block.type !== 'tool_calls') return block;
    const hasRunning = block.calls.some((tc) => tc.status === 'running');
    if (!hasRunning) return block;
    return {
      ...block,
      calls: block.calls.map((tc) =>
        tc.status === 'running' ? { ...tc, status: 'stopped' as const } : tc,
      ),
    };
  });
}

export function useAgentChat({
  onTitleUpdate,
  onConversationCreated,
}: {
  onTitleUpdate?: (title: string, conversationId?: string) => void;
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
  const conversationIdRef = useRef<string | undefined>(undefined);

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
      conversationIdRef.current = conv.id;
      return conv;
    },
    [],
  );

  const handleStreamEvent = useCallback(
    (assistantId: string, event: ChatStreamEvent) => {
      if (event.type === ChatStreamEventType.SESSION_TITLE_UPDATE) {
        const title = safeString(event.data.title);
        if (title) {
          onTitleUpdateRef.current?.(title, conversationIdRef.current);
        }
        return;
      }

      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id !== assistantId) return msg;

          switch (event.type) {
            case ChatStreamEventType.TEXT_CHUNK: {
              const text = safeString(event.data.text);
              if (!text) return msg;
              return {
                ...msg,
                blocks: appendTextToBlocks(msg.blocks, text),
              };
            }

            case ChatStreamEventType.THOUGHT_CHUNK:
              return {
                ...msg,
                thoughts: msg.thoughts + safeString(event.data.text),
              };

            case ChatStreamEventType.TOOL_CALL_START: {
              const newCall: ToolCallItem = {
                id: safeString(event.data.toolCallId) || `tc-${Date.now()}`,
                name: safeString(event.data.toolName) || 'Unknown tool',
                title: safeString(event.data.title),
                status: 'running' as const,
                kind: safeString(event.data.kind) || undefined,
                input: isRecord(event.data.rawInput)
                  ? (event.data.rawInput as Record<string, unknown>)
                  : undefined,
              };
              return {
                ...msg,
                blocks: appendToolCallToBlocks(msg.blocks, newCall),
              };
            }

            case ChatStreamEventType.TOOL_CALL_UPDATE:
            case ChatStreamEventType.TOOL_CALL_COMPLETE: {
              const tcId = safeString(event.data.toolCallId);
              if (!tcId) return msg;
              return {
                ...msg,
                blocks: updateToolCallInBlocks(msg.blocks, tcId, (tc) => ({
                  ...tc,
                  status:
                    event.type === ChatStreamEventType.TOOL_CALL_COMPLETE
                      ? ('completed' as const)
                      : tc.status,
                  output: safeString(event.data.output) || tc.output,
                  title: safeString(event.data.title) || tc.title,
                })),
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
    async (content: string, files?: File[]) => {
      setError(null);
      setWasCancelled(false);

      const userMessage: ChatMessageItem = {
        id: nextMessageId(),
        role: 'user',
        blocks: [{ type: 'text', text: content }],
        thoughts: '',
        plan: null,
        fileNames: files?.map((f) => f.name) ?? [],
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMessage]);

      const assistantId = nextMessageId();
      const assistantMessage: ChatMessageItem = {
        id: assistantId,
        role: 'assistant',
        blocks: [],
        thoughts: '',
        plan: null,
        fileNames: [],
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

      let encodedFiles:
        | { name: string; mimeType: ChatAllowedMimeType; data: string }[]
        | undefined;
      if (files && files.length > 0) {
        const oversized = files.find((f) => f.size > MAX_FILE_SIZE);
        if (oversized) {
          setError(`File "${oversized.name}" exceeds 10 MB limit`);
          setIsStreaming(false);
          setMessages((prev) => prev.filter((m) => m.id !== assistantId));
          return;
        }
        try {
          encodedFiles = await Promise.all(files.map(fileToBase64));
        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : 'Failed to read attached files',
          );
          setIsStreaming(false);
          setMessages((prev) => prev.filter((m) => m.id !== assistantId));
          return;
        }
      }

      const controller = chatApi.sendMessage(
        conv.id,
        { content, files: encodedFiles },
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
      setMessages((prev) =>
        prev.map((msg) => ({
          ...msg,
          blocks: stopRunningToolsInBlocks(msg.blocks),
        })),
      );
    }
  }, []);

  const resetChat = useCallback(() => {
    cancelStream();
    setConversation(null);
    conversationIdRef.current = undefined;
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
      conversationIdRef.current = conversationId;
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

export type MessageBlock =
  | { type: 'text'; text: string }
  | { type: 'tool_calls'; calls: ToolCallItem[] };

export type ChatMessageItem = {
  id: string;
  role: 'user' | 'assistant';
  blocks: MessageBlock[];
  thoughts: string;
  plan: PlanItem[] | null;
  fileNames: string[];
  timestamp: number;
};

export type ToolCallItem = {
  id: string;
  name: string;
  title: string;
  status: 'running' | 'completed' | 'failed' | 'stopped';
  kind?: string;
  input?: Record<string, unknown>;
  output?: string;
};

export type PlanItem = {
  content: string;
  status: 'pending' | 'in_progress' | 'completed';
};
