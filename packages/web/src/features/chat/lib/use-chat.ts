import {
  ActionPreviewEvent,
  ActionReceiptEvent,
  ChatAllowedMimeType,
  ChatConversationStatus,
  ChatHistoryMessage,
  CHAT_ALLOWED_MIME_TYPES,
  DEFAULT_CHAT_TIER_ID,
  ErrorCode,
  isNil,
  PersistedChatMessage,
  ToolApprovalRequestEvent,
  ToolProgressEvent,
  tryCatch,
} from '@activepieces/shared';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { api } from '@/lib/api';

import { chatApi } from './chat-api';
import { chatStoreSelectors, SetChatStore, ToolCallMeta } from './chat-store';
import { useChatStoreApi } from './chat-store-context';
import { ChatUIMessage, chatPartUtils } from './chat-types';
import { chatUtils } from './chat-utils';
import { useStreamingReducer } from './use-streaming-reducer';

function restoreReceiptsIntoStore({
  data,
  setState,
}: {
  data: PersistedChatMessage[] | ChatHistoryMessage[];
  setState: SetChatStore;
}): void {
  const receipts = chatUtils.extractReceiptsFromHistory(data);
  if (Object.keys(receipts).length === 0) return;
  setState((prev) => {
    const merged = { ...prev.toolCallMeta };
    for (const [toolCallId, receipt] of Object.entries(receipts)) {
      merged[toolCallId] = { ...merged[toolCallId], actionReceipt: receipt };
    }
    return { toolCallMeta: merged };
  });
}

const MAX_FILE_SIZE = 10 * 1024 * 1024;
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

type SendStatus =
  | { type: 'idle' }
  | { type: 'submitting' }
  | { type: 'cancelled' }
  | { type: 'error'; message: string };

export function useAgentChat({
  onTitleUpdate,
  onConversationCreated,
  onCreditsExhausted,
}: {
  onTitleUpdate?: (title: string) => void;
  onConversationCreated?: (conversationId: string) => void;
  onCreditsExhausted?: () => void;
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
  const onCreditsExhaustedRef = useRef(onCreditsExhausted);
  onCreditsExhaustedRef.current = onCreditsExhausted;

  const [persistedMessages, setPersistedMessages] = useState<ChatUIMessage[]>(
    [],
  );
  const persistedMessagesRef = useRef(persistedMessages);
  persistedMessagesRef.current = persistedMessages;
  const [optimisticUserMessage, setOptimisticUserMessage] =
    useState<ChatUIMessage | null>(null);

  const pendingFilesRef = useRef<
    { name: string; mimeType: ChatAllowedMimeType; data: string }[] | undefined
  >(undefined);
  const lastSentFileNamesRef = useRef<string[]>([]);
  const conversationIdRef = useRef<string | null>(null);
  const modelNameRef = useRef<string | null>(DEFAULT_CHAT_TIER_ID);
  const onTitleUpdateRef = useRef(onTitleUpdate);
  onTitleUpdateRef.current = onTitleUpdate;
  const onConversationCreatedRef = useRef(onConversationCreated);
  onConversationCreatedRef.current = onConversationCreated;

  const handleTitleUpdate = useCallback((title: string) => {
    onTitleUpdateRef.current?.(title);
  }, []);

  const handleToolProgress = useCallback(
    (event: ToolProgressEvent) => {
      store.setState((prev) => {
        const existing = prev.toolCallMeta[event.toolCallId]?.batchProgress;
        if (
          existing &&
          existing.completed === event.data.completed &&
          existing.done === event.data.done
        ) {
          return prev;
        }
        return {
          toolCallMeta: {
            ...prev.toolCallMeta,
            [event.toolCallId]: {
              ...prev.toolCallMeta[event.toolCallId],
              batchProgress: event.data,
            },
          },
        };
      });
    },
    [store],
  );

  const updateToolCallMeta = useCallback(
    <K extends keyof ToolCallMeta>(
      key: K,
      event: ToolCallMeta[K] & { toolCallId: string },
    ) => {
      store.setState((prev) => ({
        toolCallMeta: {
          ...prev.toolCallMeta,
          [event.toolCallId]: {
            ...prev.toolCallMeta[event.toolCallId],
            [key]: event,
          },
        },
      }));
    },
    [store],
  );

  const handleToolApprovalRequest = useCallback(
    (event: ToolApprovalRequestEvent) => {
      updateToolCallMeta('approvalRequest', event);
    },
    [updateToolCallMeta],
  );

  const handleActionPreview = useCallback(
    (event: ActionPreviewEvent) => {
      updateToolCallMeta('actionPreview', event);
    },
    [updateToolCallMeta],
  );

  const handleActionReceipt = useCallback(
    (event: ActionReceiptEvent) => {
      updateToolCallMeta('actionReceipt', event);
    },
    [updateToolCallMeta],
  );

  const updateSendStatus = useCallback((next: SendStatus) => {
    sendStatusRef.current = next;
    setSendStatus(next);
  }, []);

  const reconcile = useCallback(
    async (convId: string) => {
      if (conversationIdRef.current !== convId) return;
      const { data: result } = await tryCatch(() =>
        chatApi.getMessages(convId),
      );
      if (conversationIdRef.current !== convId) return;
      if (result) {
        const mapped = chatUtils.mapHistoryToUIMessages(result.data);
        setPersistedMessages(mapped);
        const restoredReplies =
          chatUtils.extractQuickRepliesFromHistory(mapped);
        if (restoredReplies.length > 0) {
          store.setState({ quickReplies: restoredReplies });
        }
        restoreReceiptsIntoStore({
          data: result.data,
          setState: store.setState,
        });
      }
      setOptimisticUserMessage(null);
    },
    [store],
  );

  const {
    streamingMessage,
    streamPhase,
    streamError,
    startStream,
    stopStream,
    clearStreamingState,
  } = useStreamingReducer({
    onTitleUpdate: handleTitleUpdate,
    onToolProgress: handleToolProgress,
    onToolApprovalRequest: handleToolApprovalRequest,
    onActionPreview: handleActionPreview,
    onActionReceipt: handleActionReceipt,
    onStreamFinished: (convId) => {
      void reconcile(convId).then(() => clearStreamingState());
    },
    onStreamError: ({ conversationId: convId, errorCode }) => {
      if (errorCode === ErrorCode.AI_CREDIT_LIMIT_EXCEEDED) {
        onCreditsExhaustedRef.current?.();
      }
      void reconcile(convId).then(() => clearStreamingState());
    },
    onStaleCheck: (convId) => {
      void tryCatch(async () => {
        const conv = await chatApi.getConversation(convId);
        if (isNil(conv) || conversationIdRef.current !== convId) return;

        if (conv.status !== ChatConversationStatus.STREAMING) {
          void reconcile(convId).then(() => clearStreamingState());
          return;
        }

        const latestAssistant =
          streamingMessage ??
          persistedMessagesRef.current.findLast((m) => m.role === 'assistant');
        const hasBlockingCard = chatStoreSelectors.hasBlockingCard({
          state: store.getState(),
          lastAssistantMessage: latestAssistant,
        });
        if (hasBlockingCard) return;

        stopStream();
        setIsPollingForAgentReply(true);
        void reconcile(convId);
      });
    },
  });

  const streamingQuickReplies = useMemo(
    () => chatPartUtils.extractQuickRepliesFromParts(streamingMessage),
    [streamingMessage],
  );

  useEffect(() => {
    if (streamingQuickReplies.length > 0) {
      store.setState({ quickReplies: streamingQuickReplies });
    }
  }, [streamingQuickReplies, store]);

  const isStreamActive = streamPhase !== 'idle';
  const isStreaming =
    isStreamActive ||
    sendStatusRef.current.type === 'submitting' ||
    isPollingForAgentReply;

  const messages: ChatUIMessage[] = useMemo(() => {
    const base = [...persistedMessages];
    if (optimisticUserMessage) base.push(optimisticUserMessage);
    if (streamingMessage) base.push(streamingMessage);
    return injectFilePartsIntoLastUserMessage({
      messages: base,
      fileNames: lastSentFileNamesRef.current,
    });
  }, [persistedMessages, optimisticUserMessage, streamingMessage]);

  const error =
    sendStatus.type === 'error'
      ? sendStatus.message
      : streamError
      ? streamError
      : null;

  const wasCancelled = sendStatus.type === 'cancelled';

  const cancelStream = useCallback(() => {
    stopStream();
    setIsPollingForAgentReply(false);
    updateSendStatus({ type: 'cancelled' });
    setOptimisticUserMessage(null);
    const convId = conversationIdRef.current;
    if (convId) {
      void chatApi.cancelConversation(convId);
    }
  }, [stopStream, updateSendStatus]);

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

      const optimisticUser: ChatUIMessage = {
        id: `optimistic-${Date.now()}`,
        role: 'user',
        parts: [
          { type: 'text', text: content },
          ...fileNamesToFileParts(fileNames),
        ],
      };

      setOptimisticUserMessage(optimisticUser);
      store.getState().resetInteractions();

      if (files && files.length > 0) {
        const oversized = files.find((f) => f.size > MAX_FILE_SIZE);
        if (oversized) {
          setOptimisticUserMessage(null);
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
          setOptimisticUserMessage(null);
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
          setOptimisticUserMessage(null);
          updateSendStatus({
            type: 'error',
            message: convError.message ?? 'Failed to start conversation',
          });
          return;
        }
        if (sendStatusRef.current.type === 'cancelled') {
          setOptimisticUserMessage(null);
          return;
        }
      }

      const convId = conversationIdRef.current;
      if (!convId) {
        setOptimisticUserMessage(null);
        updateSendStatus({
          type: 'error',
          message: 'No conversation ID',
        });
        return;
      }

      startStream(convId);
      updateSendStatus({ type: 'idle' });

      const { error: sendError } = await tryCatch(async () =>
        chatApi.sendMessage({
          conversationId: convId,
          content,
          files: pendingFilesRef.current,
        }),
      );
      if (sendError) {
        stopStream();
        setOptimisticUserMessage(null);
        if (api.isApError(sendError, ErrorCode.AI_CREDIT_LIMIT_EXCEEDED)) {
          onCreditsExhaustedRef.current?.();
          updateSendStatus({ type: 'idle' });
        } else {
          updateSendStatus({
            type: 'error',
            message: sendError.message ?? 'Failed to send message',
          });
        }
      }
    },
    [createConversation, startStream, stopStream, updateSendStatus, store],
  );

  const setConversationId = useCallback(
    async (id: string) => {
      stopStream();
      setIsPollingForAgentReply(false);
      updateSendStatus({ type: 'idle' });
      conversationIdRef.current = id;
      setConversationIdState(id);
      store.getState().resetInteractions();

      pendingFilesRef.current = undefined;
      lastSentFileNamesRef.current = [];
      setOptimisticUserMessage(null);

      setIsLoadingHistory(true);
      const [historyResult, convResult] = await Promise.all([
        tryCatch(async () => chatApi.getMessages(id)),
        tryCatch(async () => chatApi.getConversation(id)),
      ]);
      if (conversationIdRef.current !== id) return;
      if (historyResult.error || convResult.error) {
        conversationIdRef.current = null;
        setConversationIdState(null);
        setIsLoadingHistory(false);
        updateSendStatus({
          type: 'error',
          message: 'Conversation not found',
        });
        return;
      }
      const mapped = chatUtils.mapHistoryToUIMessages(historyResult.data.data);
      setPersistedMessages(mapped);
      const restoredReplies = chatUtils.extractQuickRepliesFromHistory(mapped);
      if (restoredReplies.length > 0) {
        store.setState({ quickReplies: restoredReplies });
      }
      restoreReceiptsIntoStore({
        data: historyResult.data.data,
        setState: store.setState,
      });
      modelNameRef.current = convResult.data.modelName ?? null;
      setModelNameState(convResult.data.modelName ?? null);
      if (convResult.data.status === ChatConversationStatus.STREAMING) {
        startStream(id);
      }
      setIsLoadingHistory(false);
    },
    [stopStream, startStream, updateSendStatus, store],
  );

  useQuery({
    queryKey: ['chat-agent-poll', conversationId],
    queryFn: async () => {
      if (!conversationId || conversationIdRef.current !== conversationId)
        return null;
      const [messagesResult, convResult] = await Promise.all([
        chatApi.getMessages(conversationId),
        chatApi.getConversation(conversationId),
      ]);
      if (conversationIdRef.current !== conversationId) return null;
      const mapped = chatUtils.mapHistoryToUIMessages(messagesResult.data);
      const current = persistedMessagesRef.current;
      const hasChanged =
        mapped.length !== current.length ||
        mapped.some((m, i) => m.parts.length !== current[i]?.parts.length);
      if (hasChanged) {
        setPersistedMessages(mapped);
        const restoredReplies =
          chatUtils.extractQuickRepliesFromHistory(mapped);
        if (restoredReplies.length > 0) {
          store.setState({ quickReplies: restoredReplies });
        }
      }
      if (convResult.status !== ChatConversationStatus.STREAMING) {
        setIsPollingForAgentReply(false);
      } else {
        const hasBlockingCard = chatStoreSelectors.hasBlockingCard({
          state: store.getState(),
          lastAssistantMessage: mapped[mapped.length - 1],
        });
        if (!hasBlockingCard) {
          const { data: gate } = await tryCatch(() =>
            chatApi.getPendingGate(conversationId),
          );
          if (gate && conversationIdRef.current === conversationId) {
            const gateInput = gate.toolInput ?? {};
            const isActionPreview = gate.toolName === 'ap_execute_action';
            store.setState((prev) => ({
              toolCallMeta: {
                ...prev.toolCallMeta,
                [gate.gateId]: {
                  ...prev.toolCallMeta[gate.gateId],
                  ...(isActionPreview
                    ? {
                        actionPreview: {
                          toolCallId: gate.gateId,
                          pieceName:
                            typeof gateInput.pieceName === 'string'
                              ? gateInput.pieceName
                              : '',
                          actionName:
                            typeof gateInput.actionName === 'string'
                              ? gateInput.actionName
                              : '',
                          actionDisplayName: gate.displayName,
                          input:
                            typeof gateInput.input === 'object' &&
                            gateInput.input !== null
                              ? (gateInput.input as Record<string, unknown>)
                              : {},
                          isBatch:
                            Array.isArray(gateInput.items) &&
                            gateInput.items.length > 0,
                          batchCount: Array.isArray(gateInput.items)
                            ? gateInput.items.length
                            : undefined,
                          batchSamples: Array.isArray(gateInput.items)
                            ? (
                                gateInput.items as Record<string, unknown>[]
                              ).slice(0, 3)
                            : undefined,
                        },
                      }
                    : {
                        approvalRequest: {
                          toolCallId: gate.gateId,
                          toolName: gate.toolName,
                          displayName: gate.displayName,
                        },
                      }),
                },
              },
            }));
          }
        }
      }
      return mapped;
    },
    enabled: isPollingForAgentReply && !isStreamActive,
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
