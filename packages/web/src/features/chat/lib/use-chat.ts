import {
  ChatAllowedMimeType,
  CHAT_ALLOWED_MIME_TYPES,
  ChatHistoryMessage,
  ChatMessageItem,
  isObject,
  MessageBlock,
  ToolCallItem,
  tryCatch,
} from '@activepieces/shared';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, UIMessage } from 'ai';
import { useCallback, useMemo, useRef, useState } from 'react';

import { API_URL } from '@/lib/api';
import { authenticationSession } from '@/lib/authentication-session';

import { chatApi } from './chat-api';

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
      const result = reader.result;
      if (typeof result !== 'string') {
        reject(new Error('Failed to read file'));
        return;
      }
      const base64 = result.split(',')[1];
      resolve({ name: file.name, mimeType, data: base64 });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function deriveToolStatus(state: string): ToolCallItem['status'] {
  if (state === 'output-available') return 'completed';
  if (state === 'output-error') return 'failed';
  return 'running';
}

export function extractDynamicToolOutput(part: {
  state: string;
  output?: unknown;
  errorText?: string;
}): string | undefined {
  if (part.state === 'output-available' && part.output !== undefined) {
    return typeof part.output === 'string'
      ? part.output
      : JSON.stringify(part.output);
  }
  if (part.state === 'output-error' && part.errorText) {
    return part.errorText;
  }
  return undefined;
}

export function convertUIMessagesToItems(
  messages: UIMessage[],
): ChatMessageItem[] {
  return messages
    .filter(
      (msg): msg is UIMessage & { role: 'user' | 'assistant' } =>
        msg.role === 'user' || msg.role === 'assistant',
    )
    .map((msg, idx) => {
      const blocks: MessageBlock[] = [];
      let thoughts = '';
      const fileNames: string[] = [];

      for (const part of msg.parts) {
        if (part.type === 'text' && part.text.length > 0) {
          const last = blocks[blocks.length - 1];
          if (last && last.type === 'text') {
            blocks[blocks.length - 1] = {
              type: 'text',
              text: last.text + part.text,
            };
          } else {
            blocks.push({ type: 'text', text: part.text });
          }
        } else if (part.type === 'reasoning') {
          thoughts += part.text;
        } else if (part.type === 'dynamic-tool') {
          const toolCall: ToolCallItem = {
            id: part.toolCallId,
            name: part.toolName,
            title: part.title ?? part.toolName,
            status: deriveToolStatus(part.state),
            input: isObject(part.input) ? part.input : undefined,
            output: extractDynamicToolOutput(part),
          };
          const last = blocks[blocks.length - 1];
          if (last && last.type === 'tool_calls') {
            last.calls.push(toolCall);
          } else {
            blocks.push({ type: 'tool_calls', calls: [toolCall] });
          }
        } else if (part.type === 'file' && part.filename) {
          fileNames.push(part.filename);
        }
      }

      return {
        id: `ui-${idx}-${msg.id}`,
        role: msg.role,
        blocks,
        thoughts,
        plan: null,
        fileNames,
        timestamp: Date.now(),
      };
    });
}

export function mapHistoryToUIMessages(
  data: ChatHistoryMessage[],
): UIMessage[] {
  return data.map((msg, idx) => {
    const parts: UIMessage['parts'] = [];
    if (msg.thoughts) {
      parts.push({ type: 'reasoning', text: msg.thoughts });
    }
    if (msg.content) {
      parts.push({ type: 'text', text: msg.content });
    }
    if (msg.toolCalls) {
      for (const tc of msg.toolCalls) {
        if (tc.status === 'completed') {
          parts.push({
            type: 'dynamic-tool',
            toolCallId: tc.toolCallId,
            toolName: tc.title,
            title: tc.title,
            state: 'output-available',
            input: tc.input ?? {},
            output: tc.output,
          });
        } else {
          parts.push({
            type: 'dynamic-tool',
            toolCallId: tc.toolCallId,
            toolName: tc.title,
            title: tc.title,
            state: 'output-error',
            input: tc.input ?? {},
            errorText:
              typeof tc.output === 'string' ? tc.output : 'Tool call failed',
          });
        }
      }
    }

    return {
      id: `hist-${idx}`,
      role: msg.role,
      parts,
    };
  });
}

function createUserMessageItem({
  content,
  fileNames,
}: {
  content: string;
  fileNames: string[];
}): ChatMessageItem {
  return {
    id: `pending-user`,
    role: 'user',
    blocks: [{ type: 'text', text: content }],
    thoughts: '',
    plan: null,
    fileNames,
    timestamp: Date.now(),
  };
}

function createThinkingMessageItem(): ChatMessageItem {
  return {
    id: `pending-assistant`,
    role: 'assistant',
    blocks: [],
    thoughts: '',
    plan: null,
    fileNames: [],
    timestamp: Date.now(),
  };
}

export function useAgentChat({
  onTitleUpdate,
  onConversationCreated,
}: {
  onTitleUpdate?: (title: string, conversationId?: string) => void;
  onConversationCreated?: () => void;
} = {}) {
  const [conversationId, setConversationIdState] = useState<string | null>(
    null,
  );
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [wasCancelled, setWasCancelled] = useState(false);
  const [pendingMessages, setPendingMessages] = useState<ChatMessageItem[]>([]);

  const pendingFilesRef = useRef<
    { name: string; mimeType: ChatAllowedMimeType; data: string }[] | undefined
  >(undefined);
  const conversationIdRef = useRef<string | null>(null);
  const cancelledRef = useRef(false);
  const onTitleUpdateRef = useRef(onTitleUpdate);
  onTitleUpdateRef.current = onTitleUpdate;
  const onConversationCreatedRef = useRef(onConversationCreated);
  onConversationCreatedRef.current = onConversationCreated;

  const transport = useMemo(() => {
    return new DefaultChatTransport({
      api: '/api/placeholder',
      prepareSendMessagesRequest: ({ messages: msgs }) => {
        const lastUser = [...msgs].reverse().find((m) => m.role === 'user');
        const lastUserText =
          lastUser?.parts
            .filter(
              (p): p is { type: 'text'; text: string } => p.type === 'text',
            )
            .map((p) => p.text)
            .join('') ?? '';

        const token = authenticationSession.getToken();
        const projectId = authenticationSession.getProjectId();
        const convId = conversationIdRef.current;

        return {
          api: `${API_URL}/v1/chat/conversations/${convId}/messages?projectId=${projectId}`,
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: {
            content: lastUserText,
            files: pendingFilesRef.current,
          },
        };
      },
    });
  }, []);

  const {
    messages: uiMessages,
    status,
    sendMessage: chatSendMessage,
    stop,
    setMessages: setUiMessages,
    error: useChatError,
  } = useChat({
    transport,
    onData: (dataPart) => {
      if (
        dataPart.type === 'data-session-title' &&
        isObject(dataPart.data) &&
        typeof dataPart.data['title'] === 'string'
      ) {
        onTitleUpdateRef.current?.(
          dataPart.data['title'],
          conversationIdRef.current ?? undefined,
        );
      }
    },
  });

  const sdkIsStreaming = status === 'streaming' || status === 'submitted';
  const liveMessages = useMemo(
    () => convertUIMessagesToItems(uiMessages),
    [uiMessages],
  );
  const lastLiveMessage = liveMessages[liveMessages.length - 1];
  const sdkHasAssistantContent =
    lastLiveMessage?.role === 'assistant' && lastLiveMessage.blocks.length > 0;
  const hasPending = pendingMessages.length > 0 && !sdkHasAssistantContent;
  const isStreaming = sdkIsStreaming || hasPending;

  const messages = useMemo(() => {
    if (!hasPending) return liveMessages;
    if (liveMessages.length === 0) return pendingMessages;
    const withoutEmptyAssistant = liveMessages.filter(
      (m) => !(m.role === 'assistant' && m.blocks.length === 0),
    );
    return [...withoutEmptyAssistant, createThinkingMessageItem()];
  }, [hasPending, liveMessages, pendingMessages]);

  const error = localError ?? (useChatError ? useChatError.message : null);

  const cancelStream = useCallback(() => {
    cancelledRef.current = true;
    void stop();
    setWasCancelled(true);
    setPendingMessages([]);
  }, [stop]);

  const resetChat = useCallback(() => {
    void stop();
    conversationIdRef.current = null;
    setConversationIdState(null);
    setUiMessages([]);
    setLocalError(null);
    setWasCancelled(false);
    setPendingMessages([]);
    pendingFilesRef.current = undefined;
  }, [stop, setUiMessages]);

  const createConversation = useCallback(
    async ({
      title,
      modelName,
    }: { title?: string | null; modelName?: string | null } = {}) => {
      const conv = await chatApi.createConversation({
        title: title ?? null,
        modelName: modelName ?? null,
      });
      conversationIdRef.current = conv.id;
      setConversationIdState(conv.id);
      return conv;
    },
    [],
  );

  const sendMessage = useCallback(
    async (content: string, files?: File[]) => {
      cancelledRef.current = false;
      setLocalError(null);
      setWasCancelled(false);

      setPendingMessages([
        createUserMessageItem({
          content,
          fileNames: files?.map((f) => f.name) ?? [],
        }),
        createThinkingMessageItem(),
      ]);

      if (files && files.length > 0) {
        const oversized = files.find((f) => f.size > MAX_FILE_SIZE);
        if (oversized) {
          setLocalError(`File "${oversized.name}" exceeds 10 MB limit`);
          setPendingMessages([]);
          return;
        }
        const { data: encodedFiles, error: fileError } = await tryCatch(
          async () => Promise.all(files.map(fileToBase64)),
        );
        if (fileError) {
          setLocalError(fileError.message ?? 'Failed to read attached files');
          setPendingMessages([]);
          return;
        }
        pendingFilesRef.current = encodedFiles;
      } else {
        pendingFilesRef.current = undefined;
      }

      if (!conversationIdRef.current) {
        const { error: convError } = await tryCatch(async () => {
          await createConversation({ title: content.slice(0, 100) });
          onConversationCreatedRef.current?.();
        });
        if (convError) {
          setLocalError(convError.message ?? 'Failed to start conversation');
          setPendingMessages([]);
          return;
        }
        if (cancelledRef.current) {
          setPendingMessages([]);
          return;
        }
      }

      await chatSendMessage({ text: content });
    },
    [createConversation, chatSendMessage],
  );

  const setConversationId = useCallback(
    async (id: string) => {
      void stop();
      setWasCancelled(false);
      conversationIdRef.current = id;
      setConversationIdState(id);
      setLocalError(null);
      setPendingMessages([]);
      pendingFilesRef.current = undefined;

      setIsLoadingHistory(true);
      const { data: history, error: historyError } = await tryCatch(async () =>
        chatApi.getMessages(id),
      );
      if (historyError) {
        setLocalError('Failed to load conversation history');
      } else {
        setUiMessages(mapHistoryToUIMessages(history.data));
      }
      setIsLoadingHistory(false);
    },
    [stop, setUiMessages],
  );

  return {
    conversationId,
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
