import {
  ChatAgentEventType,
  ChatAllowedMimeType,
  ChatConversationStatus,
  CHAT_ALLOWED_MIME_TYPES,
  DEFAULT_CHAT_TIER_ID,
  isObject,
  PlanStepUpdate,
  tryCatch,
  WebsocketClientEvent,
} from '@activepieces/shared';
import { useChat } from '@ai-sdk/react';
import { useQuery } from '@tanstack/react-query';
import { ChatTransport, UIMessage, UIMessageChunk } from 'ai';
import { useCallback, useMemo, useRef, useState } from 'react';

import { useSocket } from '@/components/providers/socket-provider';

import { chatApi } from './chat-api';
import { useChatStoreApi } from './chat-store-context';
import { ChatUIMessage } from './chat-types';
import { chatUtils } from './chat-utils';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const STREAM_TIMEOUT_MS = 10 * 60 * 1000;
const AGENT_POLL_INTERVAL_MS = 5_000;

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

function fileNamesToFileParts(fileNames: string[]): ChatUIMessage['parts'] {
  return fileNames.map((name) => ({
    type: 'file' as const,
    mediaType: 'text/plain' as const,
    url: '',
    filename: name,
  }));
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

function removeMessageById({
  id,
  setMessages,
}: {
  id: string;
  setMessages: (fn: (prev: ChatUIMessage[]) => ChatUIMessage[]) => void;
}) {
  setMessages((prev) => prev.filter((m) => m.id !== id));
}

const DISPLAY_CARD_DATA_TYPES = new Set([
  'data-connection-required',
  'data-connection-picker',
  'data-project-picker',
  'data-questions',
]);

type SocketEvent = {
  conversationId: string;
  type: string;
  data: unknown;
};

function createSocketChatTransport({
  socket,
  getConversationId,
  getFiles,
}: {
  socket: ReturnType<typeof useSocket>;
  getConversationId: () => string | null;
  getFiles: () =>
    | Array<{ name: string; mimeType: ChatAllowedMimeType; data: string }>
    | undefined;
}): ChatTransport<UIMessage> {
  return {
    async sendMessages({ messages, abortSignal }) {
      const conversationId = getConversationId();
      if (!conversationId) {
        throw new Error('No conversation ID');
      }

      const lastUser = messages.findLast((m) => m.role === 'user');
      const content =
        lastUser?.parts
          .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
          .map((p) => p.text)
          .join('') ?? '';

      const files = getFiles();

      let cleanupFn: () => void = () => {};
      const stream = new ReadableStream<UIMessageChunk>({
        start(controller) {
          const closeStream = () => {
            cleanupFn();
            try {
              controller.close();
            } catch {
              // stream may already be closed
            }
          };

          const timeout = setTimeout(closeStream, STREAM_TIMEOUT_MS);

          const handler = (event: SocketEvent) => {
            if (event.conversationId !== conversationId) return;
            if (event.type === ChatAgentEventType.CHUNK) {
              const chunks = Array.isArray(event.data)
                ? event.data
                : [event.data];
              for (const chunk of chunks) {
                controller.enqueue(chunk as UIMessageChunk);
              }
            } else if (event.type === ChatAgentEventType.ERROR) {
              const errorData = event.data as { message?: string };
              controller.enqueue({
                type: 'error',
                errorText: errorData?.message ?? 'An error occurred',
              } as UIMessageChunk);
            } else if (event.type === ChatAgentEventType.FINISHED) {
              closeStream();
            }
          };

          cleanupFn = () => {
            clearTimeout(timeout);
            socket.off(WebsocketClientEvent.CHAT_MESSAGE_CHUNK, handler);
          };

          socket.on(WebsocketClientEvent.CHAT_MESSAGE_CHUNK, handler);
        },
        cancel() {
          cleanupFn();
        },
      });

      abortSignal?.addEventListener('abort', () => cleanupFn(), {
        once: true,
      });

      try {
        await chatApi.sendMessage({ conversationId, content, files });
      } catch (err) {
        cleanupFn();
        throw err;
      }

      return stream;
    },

    async reconnectToStream() {
      return null;
    },
  };
}

type SendStatus =
  | { type: 'idle' }
  | { type: 'submitting' }
  | { type: 'cancelled' }
  | { type: 'error'; message: string };

export function useAgentChat({
  onTitleUpdate,
  onConversationCreated,
}: {
  onTitleUpdate?: (title: string, conversationId?: string) => void;
  onConversationCreated?: (conversationId: string) => void;
} = {}) {
  const store = useChatStoreApi();

  const [conversationId, setConversationIdState] = useState<string | null>(
    null,
  );
  const [modelName, setModelNameState] = useState<string | null>(
    DEFAULT_CHAT_TIER_ID,
  );
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isPollingForAgentReply, setIsPollingForAgentReply] = useState(false);
  const [sendStatus, setSendStatus] = useState<SendStatus>({ type: 'idle' });
  const sendStatusRef = useRef<SendStatus>({ type: 'idle' });

  const pendingFilesRef = useRef<
    { name: string; mimeType: ChatAllowedMimeType; data: string }[] | undefined
  >(undefined);
  const lastSentFileNamesRef = useRef<string[]>([]);
  const conversationIdRef = useRef<string | null>(null);
  const modelNameRef = useRef<string | null>(DEFAULT_CHAT_TIER_ID);
  const optimisticIdRef = useRef<string | null>(null);
  const onTitleUpdateRef = useRef(onTitleUpdate);
  onTitleUpdateRef.current = onTitleUpdate;
  const onConversationCreatedRef = useRef(onConversationCreated);
  onConversationCreatedRef.current = onConversationCreated;

  const handleDataPart = useCallback(
    (dataPart: { type: string; data: unknown }) => {
      if (!isObject(dataPart.data)) return;
      const d = dataPart.data;

      switch (dataPart.type) {
        case 'data-approval-request':
          if (typeof d.gateId === 'string' && typeof d.toolName === 'string') {
            store.setState({
              pendingApprovalRequest: {
                gateId: d.gateId,
                toolName: d.toolName,
                displayName:
                  typeof d.displayName === 'string'
                    ? d.displayName
                    : d.toolName,
              },
            });
          }
          break;

        case 'data-plan-approval-request':
          if (typeof d.gateId === 'string') {
            store.setState({
              pendingPlanApproval: {
                gateId: d.gateId,
                planSummary:
                  typeof d.planSummary === 'string' ? d.planSummary : '',
                steps: Array.isArray(d.steps) ? (d.steps as string[]) : [],
              },
            });
          }
          break;

        case 'data-plan-progress':
          if (typeof d.stepIndex === 'number' && typeof d.status === 'string') {
            store.setState((prev) => {
              const stepIndex = d.stepIndex as number;
              const status = d.status as PlanStepUpdate['status'];
              const existing = prev.planProgressUpdates.findIndex(
                (u) => u.stepIndex === stepIndex,
              );
              if (existing >= 0) {
                const updated = [...prev.planProgressUpdates];
                updated[existing] = { stepIndex, status };
                return { planProgressUpdates: updated };
              }
              return {
                planProgressUpdates: [
                  ...prev.planProgressUpdates,
                  { stepIndex, status },
                ],
              };
            });
          }
          break;

        case 'data-quick-replies':
          if (Array.isArray(d.replies)) {
            store.setState({ quickReplies: d.replies as string[] });
          }
          break;

        default:
          if (DISPLAY_CARD_DATA_TYPES.has(dataPart.type)) {
            store.setState({ displayCard: { type: dataPart.type, data: d } });
          }
          break;
      }
    },
    [store],
  );

  const updateSendStatus = useCallback((next: SendStatus) => {
    sendStatusRef.current = next;
    setSendStatus(next);
  }, []);

  const socket = useSocket();

  const transport = useMemo(() => {
    return createSocketChatTransport({
      socket,
      getConversationId: () => conversationIdRef.current,
      getFiles: () => pendingFilesRef.current,
    });
  }, [socket]);

  const {
    messages: uiMessages,
    status,
    sendMessage: chatSendMessage,
    stop,
    setMessages: sdkSetMessages,
    error: useChatError,
  } = useChat({
    transport,
    experimental_throttle: 100,
    onData: (dataPart) => {
      const data = dataPart.data;
      if (
        dataPart.type === 'data-session-title' &&
        isObject(data) &&
        typeof data['title'] === 'string'
      ) {
        onTitleUpdateRef.current?.(
          data['title'],
          conversationIdRef.current ?? undefined,
        );
      }
      handleDataPart(dataPart);
    },
    onError: () => {
      if (optimisticIdRef.current) {
        removeMessageById({
          id: optimisticIdRef.current,
          setMessages: sdkSetMessages as (
            fn: (prev: ChatUIMessage[]) => ChatUIMessage[],
          ) => void,
        });
        optimisticIdRef.current = null;
      }
      const convId = conversationIdRef.current;
      if (convId) {
        setTimeout(async () => {
          if (conversationIdRef.current !== convId) return;
          const { data: result } = await tryCatch(() =>
            chatApi.getMessages(convId),
          );
          if (result && conversationIdRef.current === convId) {
            (sdkSetMessages as (msgs: ChatUIMessage[]) => void)(
              chatUtils.mapHistoryToUIMessages(result.data),
            );
          }
        }, 3000);
      }
    },
  });

  const setUiMessages = sdkSetMessages as (
    msgs: ChatUIMessage[] | ((prev: ChatUIMessage[]) => ChatUIMessage[]),
  ) => void;

  const sdkIsActive = status === 'streaming' || status === 'submitted';
  const isStreaming =
    sdkIsActive ||
    sendStatusRef.current.type === 'submitting' ||
    isPollingForAgentReply;

  const messages: ChatUIMessage[] = useMemo(() => {
    return injectFilePartsIntoLastUserMessage({
      messages: uiMessages as ChatUIMessage[],
      fileNames: lastSentFileNamesRef.current,
    });
  }, [uiMessages]);

  const error =
    sendStatus.type === 'error'
      ? sendStatus.message
      : useChatError
      ? useChatError.message
      : null;

  const wasCancelled = sendStatus.type === 'cancelled';

  const cancelStream = useCallback(() => {
    void stop();
    updateSendStatus({ type: 'cancelled' });
    if (optimisticIdRef.current) {
      removeMessageById({
        id: optimisticIdRef.current,
        setMessages: setUiMessages,
      });
      optimisticIdRef.current = null;
    }
  }, [stop, setUiMessages, updateSendStatus]);

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
      updateSendStatus({ type: 'submitting' });

      const fileNames = files?.map((f) => f.name) ?? [];
      lastSentFileNamesRef.current = fileNames;

      const optimisticId = `optimistic-${Date.now()}`;
      optimisticIdRef.current = optimisticId;
      const optimisticUser: ChatUIMessage = {
        id: optimisticId,
        role: 'user',
        parts: [
          { type: 'text', text: content },
          ...fileNamesToFileParts(fileNames),
        ],
      };

      setUiMessages((prev) => [...prev, optimisticUser]);
      store.getState().resetInteractions();

      if (files && files.length > 0) {
        const oversized = files.find((f) => f.size > MAX_FILE_SIZE);
        if (oversized) {
          removeMessageById({ id: optimisticId, setMessages: setUiMessages });
          optimisticIdRef.current = null;
          updateSendStatus({
            type: 'error',
            message: `File "${oversized.name}" exceeds 10 MB limit`,
          });
          return;
        }
        const { data: encodedFiles, error: fileError } = await tryCatch(
          async () => Promise.all(files.map(fileToBase64)),
        );
        if (fileError) {
          removeMessageById({ id: optimisticId, setMessages: setUiMessages });
          optimisticIdRef.current = null;
          updateSendStatus({
            type: 'error',
            message: fileError.message ?? 'Failed to read attached files',
          });
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
          removeMessageById({ id: optimisticId, setMessages: setUiMessages });
          optimisticIdRef.current = null;
          updateSendStatus({
            type: 'error',
            message: convError.message ?? 'Failed to start conversation',
          });
          return;
        }
        if (sendStatusRef.current.type === 'cancelled') {
          removeMessageById({ id: optimisticId, setMessages: setUiMessages });
          optimisticIdRef.current = null;
          return;
        }
      }

      updateSendStatus({ type: 'idle' });
      await chatSendMessage({ text: content, messageId: optimisticId });
      optimisticIdRef.current = null;
    },
    [
      createConversation,
      chatSendMessage,
      setUiMessages,
      updateSendStatus,
      store,
    ],
  );

  const setConversationId = useCallback(
    async (id: string) => {
      void stop();
      setIsPollingForAgentReply(false);
      updateSendStatus({ type: 'idle' });
      conversationIdRef.current = id;
      setConversationIdState(id);
      store.getState().resetInteractions();

      pendingFilesRef.current = undefined;
      lastSentFileNamesRef.current = [];
      optimisticIdRef.current = null;

      setIsLoadingHistory(true);
      const [historyResult, convResult] = await Promise.all([
        tryCatch(async () => chatApi.getMessages(id)),
        tryCatch(async () => chatApi.getConversation(id)),
      ]);
      if (conversationIdRef.current !== id) return;
      if (historyResult.error) {
        updateSendStatus({
          type: 'error',
          message: 'Failed to load conversation history',
        });
      } else {
        const uiMessages = chatUtils.mapHistoryToUIMessages(
          historyResult.data.data,
        );
        setUiMessages(uiMessages);
        const restoredReplies =
          chatUtils.extractQuickRepliesFromHistory(uiMessages);
        if (restoredReplies.length > 0) {
          store.setState({ quickReplies: restoredReplies });
        }
      }
      if (convResult.data) {
        modelNameRef.current = convResult.data.modelName ?? null;
        setModelNameState(convResult.data.modelName ?? null);
        if (convResult.data.status === ChatConversationStatus.STREAMING) {
          setIsPollingForAgentReply(true);
        }
      }
      setIsLoadingHistory(false);
    },
    [stop, setUiMessages, updateSendStatus, store],
  );

  useQuery({
    queryKey: ['chat-agent-poll', conversationId],
    queryFn: async () => {
      if (!conversationId) return null;
      const [messagesResult, convResult] = await Promise.all([
        chatApi.getMessages(conversationId),
        chatApi.getConversation(conversationId),
      ]);
      const mapped = chatUtils.mapHistoryToUIMessages(messagesResult.data);
      const currentMessages = uiMessages as ChatUIMessage[];
      const hasChanged =
        mapped.length !== currentMessages.length ||
        mapped.some(
          (m, i) => m.parts.length !== currentMessages[i]?.parts.length,
        );
      if (hasChanged) {
        setUiMessages(mapped);
        const restoredReplies =
          chatUtils.extractQuickRepliesFromHistory(mapped);
        if (restoredReplies.length > 0) {
          store.setState({ quickReplies: restoredReplies });
        }
      }
      if (convResult.status !== ChatConversationStatus.STREAMING) {
        setIsPollingForAgentReply(false);
      }
      return mapped;
    },
    enabled: isPollingForAgentReply && !sdkIsActive,
    refetchInterval: AGENT_POLL_INTERVAL_MS,
  });

  const setModelName = useCallback(async (newModelName: string) => {
    modelNameRef.current = newModelName;
    setModelNameState(newModelName);
    const convId = conversationIdRef.current;
    if (convId) {
      await chatApi
        .updateConversation(convId, { modelName: newModelName })
        .catch(() => undefined);
    }
  }, []);

  return {
    conversationId,
    modelName,
    messages,
    isStreaming,
    wasCancelled,
    isLoadingHistory,
    error,
    sendMessage,
    cancelStream,
    setConversationId,
    setModelName,
  };
}
