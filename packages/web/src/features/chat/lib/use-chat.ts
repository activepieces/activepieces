import {
  ChatAllowedMimeType,
  CHAT_ALLOWED_MIME_TYPES,
  ChatHistoryMessage,
  tryCatch,
} from '@activepieces/shared';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useCallback, useMemo, useRef, useState } from 'react';

import { API_URL } from '@/lib/api';
import { authenticationSession } from '@/lib/authentication-session';

import { chatApi } from './chat-api';
import { ChatUIMessage } from './chat-types';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const RECOVERY_DELAY_MS = 3_000;
const RECOVERY_MAX_ATTEMPTS = 5;

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

function mapHistoryToUIMessages(data: ChatHistoryMessage[]): ChatUIMessage[] {
  return data.map((msg, idx) => {
    const parts: ChatUIMessage['parts'] = [];
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

function fileNamesToFileParts(fileNames: string[]): ChatUIMessage['parts'] {
  return fileNames.map((name) => ({
    type: 'file' as const,
    mediaType: 'text/plain' as const,
    url: '',
    filename: name,
  }));
}

function createPendingUserMessage({
  content,
  fileNames,
}: {
  content: string;
  fileNames: string[];
}): ChatUIMessage {
  return {
    id: 'pending-user',
    role: 'user',
    parts: [
      { type: 'text', text: content },
      ...fileNamesToFileParts(fileNames),
    ],
  };
}

function createPendingAssistantMessage(): ChatUIMessage {
  return {
    id: 'pending-assistant',
    role: 'assistant',
    parts: [],
  };
}

function hasAssistantContent(msg: ChatUIMessage): boolean {
  return msg.parts.some(
    (p) =>
      (p.type === 'text' && p.text.length > 0) ||
      p.type === 'reasoning' ||
      p.type === 'dynamic-tool',
  );
}

function injectFilePartsIntoLastUserMessage({
  messages,
  fileNames,
}: {
  messages: ChatUIMessage[];
  fileNames: string[];
}): ChatUIMessage[] {
  if (fileNames.length === 0) return messages;
  const lastUserIdx = messages.findLastIndex((m) => m.role === 'user');
  if (lastUserIdx === -1) return messages;
  const lastUser = messages[lastUserIdx];
  const alreadyHasFiles = lastUser.parts.some((p) => p.type === 'file');
  if (alreadyHasFiles) return messages;
  const patched = {
    ...lastUser,
    parts: [...lastUser.parts, ...fileNamesToFileParts(fileNames)],
  };
  const result = [...messages];
  result[lastUserIdx] = patched;
  return result;
}

export function useAgentChat({
  onTitleUpdate,
  onConversationCreated,
  modelName,
}: {
  onTitleUpdate?: (title: string, conversationId?: string) => void;
  onConversationCreated?: (conversationId: string) => void;
  modelName?: string | null;
} = {}) {
  const [conversationId, setConversationIdState] = useState<string | null>(
    null,
  );
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [wasCancelled, setWasCancelled] = useState(false);
  const [pendingMessages, setPendingMessages] = useState<ChatUIMessage[]>([]);
  const [loadedModelName, setLoadedModelName] = useState<string | null>(null);

  const pendingFilesRef = useRef<
    { name: string; mimeType: ChatAllowedMimeType; data: string }[] | undefined
  >(undefined);
  const lastSentFileNamesRef = useRef<string[]>([]);
  const conversationIdRef = useRef<string | null>(null);
  const cancelledRef = useRef(false);
  const messageCountRef = useRef(0);
  const onTitleUpdateRef = useRef(onTitleUpdate);
  onTitleUpdateRef.current = onTitleUpdate;
  const onConversationCreatedRef = useRef(onConversationCreated);
  onConversationCreatedRef.current = onConversationCreated;
  const modelNameRef = useRef(modelName);
  modelNameRef.current = modelName;

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
        typeof dataPart.data === 'object' &&
        dataPart.data !== null &&
        typeof (dataPart.data as Record<string, unknown>)['title'] === 'string'
      ) {
        onTitleUpdateRef.current?.(
          (dataPart.data as Record<string, unknown>)['title'] as string,
          conversationIdRef.current ?? undefined,
        );
      }
    },
    onError: () => {
      setPendingMessages([]);
      if (cancelledRef.current) return;
      const convId = conversationIdRef.current;
      if (!convId) return;
      const recoverMessages = async (): Promise<void> => {
        const previousCount = messageCountRef.current;
        for (let attempt = 0; attempt < RECOVERY_MAX_ATTEMPTS; attempt++) {
          await new Promise((r) => setTimeout(r, RECOVERY_DELAY_MS));
          if (cancelledRef.current || conversationIdRef.current !== convId)
            return;
          const { data: result, error } = await tryCatch(() =>
            chatApi.getMessages(convId),
          );
          if (error) continue;
          if (result.data.length > previousCount) {
            if (conversationIdRef.current !== convId) return;
            setUiMessages(mapHistoryToUIMessages(result.data));
            return;
          }
        }
        if (conversationIdRef.current !== convId) return;
        const { data: finalResult } = await tryCatch(() =>
          chatApi.getMessages(convId),
        );
        if (finalResult) {
          if (conversationIdRef.current !== convId) return;
          setUiMessages(mapHistoryToUIMessages(finalResult.data));
        }
      };
      void recoverMessages();
    },
  });

  messageCountRef.current = uiMessages.length;

  const sdkIsStreaming = status === 'streaming' || status === 'submitted';
  const lastLiveMessage = uiMessages[uiMessages.length - 1];
  const sdkHasAssistantContent =
    lastLiveMessage?.role === 'assistant' &&
    hasAssistantContent(lastLiveMessage as ChatUIMessage);
  const hasPending = pendingMessages.length > 0 && !sdkHasAssistantContent;
  const isStreaming = sdkIsStreaming || hasPending;

  const messages: ChatUIMessage[] = useMemo(() => {
    const fileNames = lastSentFileNamesRef.current;
    const liveMessages = uiMessages as ChatUIMessage[];
    if (!hasPending)
      return injectFilePartsIntoLastUserMessage({
        messages: liveMessages,
        fileNames,
      });
    if (liveMessages.length === 0) return pendingMessages;
    const withoutEmptyAssistant = injectFilePartsIntoLastUserMessage({
      messages: liveMessages.filter(
        (m) => !(m.role === 'assistant' && !hasAssistantContent(m)),
      ),
      fileNames,
    });
    return [...withoutEmptyAssistant, createPendingAssistantMessage()];
  }, [hasPending, uiMessages, pendingMessages]);

  const error = localError ?? (useChatError ? useChatError.message : null);

  const cancelStream = useCallback(() => {
    cancelledRef.current = true;
    void stop();
    setWasCancelled(true);
    setPendingMessages([]);
    const convId = conversationIdRef.current;
    if (convId) {
      void chatApi.cancelSession(convId).catch(() => undefined);
    }
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
    lastSentFileNamesRef.current = [];
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

      const fileNames = files?.map((f) => f.name) ?? [];
      lastSentFileNamesRef.current = fileNames;

      setPendingMessages([
        createPendingUserMessage({
          content,
          fileNames,
        }),
        createPendingAssistantMessage(),
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
          const conv = await createConversation({
            title: content.slice(0, 100),
            modelName: modelNameRef.current,
          });
          onConversationCreatedRef.current?.(conv.id);
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
      lastSentFileNamesRef.current = [];

      setIsLoadingHistory(true);
      const [conversationResult, historyResult] = await Promise.all([
        tryCatch(async () => chatApi.getConversation(id)),
        tryCatch(async () => chatApi.getMessages(id)),
      ]);
      if (conversationResult.error) {
        console.warn(
          'Failed to load conversation details',
          conversationResult.error,
        );
      } else if (conversationResult.data?.modelName) {
        setLoadedModelName(conversationResult.data.modelName);
      }
      if (historyResult.error) {
        setLocalError('Failed to load conversation history');
      } else {
        setUiMessages(mapHistoryToUIMessages(historyResult.data.data));
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
    loadedModelName,
    sendMessage,
    cancelStream,
    resetChat,
    createConversation,
    setConversationId,
  };
}
