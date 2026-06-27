import { apId, ErrorCode, isNil, tryCatch } from '@activepieces/core-utils';
import {
  ActionPreviewEvent,
  ActionReceiptEvent,
  BuildPlanEvent,
  ChatAllowedMimeType,
  FileProducedEvent,
  ImageGeneratedEvent,
  ChatConversationStatus,
  ChatHistoryMessage,
  ChatMention,
  CHAT_ALLOWED_MIME_TYPES,
  DEFAULT_CHAT_TIER_ID,
  PersistedChatMessage,
  StageOpenEvent,
  ToolProgressEvent,
} from '@activepieces/shared';
import { useQuery } from '@tanstack/react-query';
import { t } from 'i18next';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { api } from '@/lib/api';
import { chatDebug } from '@/lib/chat-debug-logger';

import { chatApi } from './chat-api';
import {
  chatBuildUtils,
  chatStoreSelectors,
  SetChatStore,
  ToolCallMeta,
} from './chat-store';
import { useChatStoreApi } from './chat-store-context';
import { ActiveChatContext, ChatUIMessage, chatPartUtils } from './chat-types';
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
  const images = chatUtils.extractImagesFromHistory(data);
  const files = chatUtils.extractFilesFromHistory(data);
  const builds = chatUtils.extractBuildsFromHistory(data);
  if (
    Object.keys(receipts).length === 0 &&
    Object.keys(images).length === 0 &&
    Object.keys(files).length === 0 &&
    Object.keys(builds).length === 0
  ) {
    return;
  }
  setState((prev) => {
    const merged = { ...prev.toolCallMeta };
    for (const [toolCallId, receipt] of Object.entries(receipts)) {
      merged[toolCallId] = { ...merged[toolCallId], actionReceipt: receipt };
    }
    for (const [toolCallId, image] of Object.entries(images)) {
      merged[toolCallId] = { ...merged[toolCallId], image };
    }
    for (const [toolCallId, toolFiles] of Object.entries(files)) {
      merged[toolCallId] = { ...merged[toolCallId], files: toolFiles };
    }
    const mergedBuilds = { ...prev.builds };
    for (const [buildId, build] of Object.entries(builds)) {
      const existing = mergedBuilds[buildId];
      if (existing && existing.updatedAt >= build.updatedAt) continue;
      mergedBuilds[buildId] = build;
    }
    return { toolCallMeta: merged, builds: mergedBuilds };
  });
}

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const AGENT_POLL_INTERVAL_MS = 5_000;

function buildToolCallMetaFromGate(gate: {
  gateId: string;
  toolName: string;
  displayName: string;
  toolInput: Record<string, unknown>;
}): Record<string, ToolCallMeta> {
  if (chatPartUtils.isDisplayTool(gate.toolName)) {
    return {};
  }
  const gateInput = gate.toolInput ?? {};
  let actionPreview: ActionPreviewEvent | null = null;
  if (gate.toolName === 'ap_execute_action') {
    actionPreview = {
      toolCallId: gate.gateId,
      pieceName:
        typeof gateInput.pieceName === 'string' ? gateInput.pieceName : '',
      actionName:
        typeof gateInput.actionName === 'string' ? gateInput.actionName : '',
      actionDisplayName: gate.displayName,
      input:
        typeof gateInput.input === 'object' && gateInput.input !== null
          ? (gateInput.input as Record<string, unknown>)
          : {},
      isBatch:
        typeof gateInput.batchCount === 'number' && gateInput.batchCount > 0,
      batchCount:
        typeof gateInput.batchCount === 'number'
          ? gateInput.batchCount
          : undefined,
      batchSamples: Array.isArray(gateInput.items)
        ? (gateInput.items as Record<string, unknown>[]).slice(0, 3)
        : undefined,
    };
  } else if (gate.toolName === 'ap_test_flow') {
    actionPreview = {
      toolCallId: gate.gateId,
      pieceName: '',
      actionName: 'ap_test_flow',
      actionDisplayName: gate.displayName,
      input: {},
      isBatch: false,
    };
  }
  return actionPreview ? { [gate.gateId]: { actionPreview } } : {};
}

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
  onStageOpen,
  getActiveContext,
}: {
  onTitleUpdate?: (title: string) => void;
  onConversationCreated?: (conversationId: string) => void;
  onCreditsExhausted?: () => void;
  onStageOpen?: (event: StageOpenEvent) => void;
  getActiveContext?: () => ActiveChatContext | undefined;
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
  const onStageOpenRef = useRef(onStageOpen);
  onStageOpenRef.current = onStageOpen;

  const [persistedMessages, setPersistedMessages] = useState<ChatUIMessage[]>(
    [],
  );
  const persistedMessagesRef = useRef(persistedMessages);
  persistedMessagesRef.current = persistedMessages;
  const [optimisticUserMessage, setOptimisticUserMessage] =
    useState<ChatUIMessage | null>(null);
  const optimisticUserMessageRef = useRef(optimisticUserMessage);
  optimisticUserMessageRef.current = optimisticUserMessage;

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
  const getActiveContextRef = useRef(getActiveContext);
  getActiveContextRef.current = getActiveContext;

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

  const handleImageGenerated = useCallback(
    (event: ImageGeneratedEvent) => {
      updateToolCallMeta('image', event);
    },
    [updateToolCallMeta],
  );

  const handleFileProduced = useCallback(
    (event: FileProducedEvent) => {
      store.setState((prev) => {
        const existing = prev.toolCallMeta[event.toolCallId]?.files ?? [];
        if (existing.some((file) => file.fileId === event.fileId)) return prev;
        return {
          toolCallMeta: {
            ...prev.toolCallMeta,
            [event.toolCallId]: {
              ...prev.toolCallMeta[event.toolCallId],
              files: [...existing, event],
            },
          },
        };
      });
    },
    [store],
  );

  const handleBuildPlan = useCallback(
    (event: BuildPlanEvent) => {
      store.setState((prev) => {
        const builds = chatBuildUtils.mergeBuildPlan({
          builds: prev.builds,
          event,
        });
        if (builds === prev.builds) return prev;
        return { builds };
      });
    },
    [store],
  );

  const handleStageOpen = useCallback((event: StageOpenEvent) => {
    onStageOpenRef.current?.(event);
  }, []);

  const updateSendStatus = useCallback((next: SendStatus) => {
    sendStatusRef.current = next;
    setSendStatus(next);
  }, []);

  const reconcile = useCallback(
    async (convId: string): Promise<ChatUIMessage[] | null> => {
      if (conversationIdRef.current !== convId) return null;
      const { data: result } = await tryCatch(() =>
        chatApi.getMessages(convId),
      );
      if (conversationIdRef.current !== convId) return null;
      if (!result) return null;
      const mapped = chatUtils.mapHistoryToUIMessages(result.data);
      const restoredReplies = chatUtils.extractQuickRepliesFromHistory(mapped);
      if (restoredReplies.length > 0) {
        store.setState({ quickReplies: restoredReplies });
      }
      restoreReceiptsIntoStore({
        data: result.data,
        setState: store.setState,
      });
      return mapped;
    },
    [store],
  );

  const settleStreamRef = useRef<
    (
      convId: string,
      opts?: { errorMessage?: string; suppressNoReply?: boolean },
    ) => void
  >(() => {});

  const {
    streamingMessage,
    streamPhase,
    streamError,
    streamGeneration,
    isResumedStream,
    startStream,
    setActiveRunId,
    stopStream,
    clearStreamingState,
  } = useStreamingReducer({
    onTitleUpdate: handleTitleUpdate,
    onToolProgress: handleToolProgress,
    onActionPreview: handleActionPreview,
    onActionReceipt: handleActionReceipt,
    onImageGenerated: handleImageGenerated,
    onFileProduced: handleFileProduced,
    onBuildPlan: handleBuildPlan,
    onStageOpen: handleStageOpen,
    onStreamFinished: (convId) => {
      chatDebug.info({ conversation: { id: convId } }, 'stream finished');
      settleStreamRef.current(convId);
    },
    onStreamError: ({ conversationId: convId, errorCode, errorMessage }) => {
      chatDebug.error(
        { conversation: { id: convId }, errorCode, error: errorMessage },
        'stream error',
      );
      if (errorCode === ErrorCode.AI_CREDIT_LIMIT_EXCEEDED) {
        onCreditsExhaustedRef.current?.();
        settleStreamRef.current(convId, { suppressNoReply: true });
        return;
      }
      settleStreamRef.current(convId, { errorMessage });
    },
    onStaleCheck: (convId) => {
      void tryCatch(async () => {
        const conv = await chatApi.getConversation(convId);
        if (isNil(conv) || conversationIdRef.current !== convId) return;

        if (conv.status !== ChatConversationStatus.STREAMING) {
          settleStreamRef.current(convId);
        }
      });
    },
  });

  // Settles a stream once the run ends. Reconciles server history into the view,
  // but never wipes the user's message on an empty reconcile (e.g. the worker
  // never ran), and surfaces an error — explicit, or a "no response" fallback
  // when the run ended without an assistant reply — instead of blanking the panel.
  settleStreamRef.current = (convId, opts) => {
    const gen = streamGeneration.current;
    void reconcile(convId).then((mapped) => {
      if (conversationIdRef.current !== convId) return;
      // Defense-in-depth: a settled turn's history should only ever grow (it now
      // includes the just-finished reply). Refuse a strictly-shorter reconcile so
      // a transient server hiccup can never collapse the visible conversation.
      const isShrink =
        mapped !== null && mapped.length < persistedMessagesRef.current.length;
      const history = mapped && mapped.length > 0 && !isShrink ? mapped : null;
      if (history) {
        setPersistedMessages(history);
        setOptimisticUserMessage(null);
      }
      const hasReply =
        history !== null &&
        history.findLastIndex((m) => m.role === 'assistant') >
          history.findLastIndex((m) => m.role === 'user');
      if (opts?.errorMessage) {
        updateSendStatus({ type: 'error', message: opts.errorMessage });
      } else if (!hasReply && !opts?.suppressNoReply) {
        updateSendStatus({
          type: 'error',
          message: t('The assistant did not respond. Please try again.'),
        });
      }
      clearStreamingState(gen);
    });
  };

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

  const isAwaitingResponse =
    streamPhase === 'awaiting-stream' ||
    streamPhase === 'streaming' ||
    sendStatus.type === 'submitting';

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

  const streamingMessageRef = useRef(streamingMessage);
  streamingMessageRef.current = streamingMessage;

  // Folds the in-flight turn (optimistic user message + live streaming assistant)
  // into persisted history so it stays painted continuously when the turn is
  // preempted or cancelled — otherwise both halves live only in ephemeral state
  // and vanish until the next end-of-turn reconcile. Deduped by id so it can
  // never double-add; the reconcile later replaces persisted with authoritative
  // server history.
  const commitInFlightTurn = useCallback(() => {
    const inflightUser = optimisticUserMessageRef.current;
    const inflightStreaming = streamingMessageRef.current;
    const hasStreaming =
      !!inflightStreaming && inflightStreaming.parts.length > 0;
    if (!inflightUser && !hasStreaming) return;
    setPersistedMessages((prev) => {
      const existingIds = new Set(prev.map((m) => m.id));
      const additions: ChatUIMessage[] = [];
      if (inflightUser && !existingIds.has(inflightUser.id)) {
        additions.push(inflightUser);
      }
      if (
        hasStreaming &&
        inflightStreaming &&
        !existingIds.has(inflightStreaming.id)
      ) {
        additions.push(inflightStreaming);
      }
      return additions.length > 0 ? [...prev, ...additions] : prev;
    });
  }, []);

  const cancelStream = useCallback(() => {
    commitInFlightTurn();
    stopStream();
    setOptimisticUserMessage(null);
    setIsPollingForAgentReply(false);
    updateSendStatus({ type: 'cancelled' });
    const convId = conversationIdRef.current;
    if (convId) {
      void chatApi.cancelConversation(convId);
    }
  }, [commitInFlightTurn, stopStream, updateSendStatus]);

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
    async (content: string, files?: File[], mentions?: ChatMention[]) => {
      updateSendStatus({ type: 'submitting' });

      const fileNames = files?.map((f) => f.name) ?? [];
      lastSentFileNamesRef.current = fileNames;

      // Snapshot of what the user had open in the Stage when they hit send. Stored
      // on the message and shipped over the wire (the server uses it for the prompt
      // + working project). Whether it renders as a "Switched to …" marker is decided
      // at render time by comparing against the previous committed context.
      const activeContext = getActiveContextRef.current?.();

      const optimisticUser: ChatUIMessage = {
        id: `optimistic-${Date.now()}`,
        role: 'user',
        parts: [
          { type: 'text', text: content },
          ...fileNamesToFileParts(fileNames),
        ],
        ...(activeContext ? { context: activeContext } : {}),
      };

      // Preempting an in-flight turn: keep its messages on screen by folding them
      // into persisted history before they get overwritten/reset below, then clear
      // the live stream so it isn't shown twice during the send.
      commitInFlightTurn();
      stopStream();
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

      const runId = apId();
      startStream(convId);
      setActiveRunId(runId);
      updateSendStatus({ type: 'idle' });
      chatDebug.info(
        {
          conversation: { id: convId },
          run: { id: runId },
          contentLength: content.length,
          filesCount: pendingFilesRef.current?.length ?? 0,
          activeContext: activeContext
            ? {
                type: activeContext.type,
                id: activeContext.id,
                projectId: activeContext.projectId,
                hasExcerpt: !isNil(activeContext.excerpt),
                focus: activeContext.focus?.label,
              }
            : undefined,
        },
        'sending chat message',
      );

      const { error: sendError } = await tryCatch(async () =>
        chatApi.sendMessage({
          conversationId: convId,
          content,
          runId,
          files: pendingFilesRef.current,
          activeContext,
          mentions,
        }),
      );
      if (sendError) {
        chatDebug.error(
          {
            conversation: { id: convId },
            run: { id: runId },
            error: sendError.message,
          },
          'chat message send failed',
        );
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
    [
      createConversation,
      startStream,
      setActiveRunId,
      stopStream,
      updateSendStatus,
      commitInFlightTurn,
      store,
    ],
  );

  const setConversationId = useCallback(
    async (id: string) => {
      if (conversationIdRef.current === id) return;
      stopStream();
      setIsPollingForAgentReply(false);
      updateSendStatus({ type: 'idle' });
      conversationIdRef.current = id;
      setConversationIdState(id);
      store.getState().resetInteractions();
      store.getState().resetBuilds();

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
        const lastAssistantIdx = mapped.findLastIndex(
          (m) => m.role === 'assistant',
        );
        const lastUserIdx = mapped.findLastIndex((m) => m.role === 'user');
        const isCurrentStreamingResponse =
          lastAssistantIdx >= 0 && lastAssistantIdx > lastUserIdx;
        if (isCurrentStreamingResponse) {
          setPersistedMessages(mapped.slice(0, lastAssistantIdx));
        } else {
          setPersistedMessages(mapped);
        }
        const { data: gate } = await tryCatch(() => chatApi.getPendingGate(id));
        if (conversationIdRef.current !== id) return;
        const baseParts = isCurrentStreamingResponse
          ? mapped[lastAssistantIdx].parts
          : undefined;
        const displayGatePart =
          gate && chatPartUtils.isDisplayTool(gate.toolName)
            ? {
                type: 'dynamic-tool' as const,
                toolCallId: gate.gateId,
                toolName: gate.toolName,
                title: gate.displayName,
                state: 'input-available' as const,
                input: gate.toolInput,
              }
            : undefined;
        startStream(id, {
          initialParts: displayGatePart
            ? [...(baseParts ?? []), displayGatePart]
            : baseParts,
        });
        if (gate) {
          store.setState((prev) => ({
            toolCallMeta: {
              ...prev.toolCallMeta,
              ...buildToolCallMetaFromGate(gate),
            },
          }));
        }
      } else {
        setPersistedMessages(mapped);
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
      // Never let a poll shrink the visible history — only apply growth or
      // in-place part updates, never a truncation.
      const hasChanged =
        mapped.length >= current.length &&
        (mapped.length !== current.length ||
          mapped.some((m, i) => m.parts.length !== current[i]?.parts.length));
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
            store.setState((prev) => ({
              toolCallMeta: {
                ...prev.toolCallMeta,
                ...buildToolCallMetaFromGate(gate),
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
    isResumedStream,
    isAwaitingResponse,
    wasCancelled,
    isLoadingHistory,
    error,
    sendMessage,
    cancelStream,
    setConversationId,
    setModelName,
  };
}
