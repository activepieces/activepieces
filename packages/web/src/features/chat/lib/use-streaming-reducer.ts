import {
  ActionPreviewEvent,
  ActionReceiptEvent,
  BuildPlanEvent,
  ChatAgentEventType,
  FileProducedEvent,
  ImageGeneratedEvent,
  ToolProgressEvent,
  WebsocketClientEvent,
} from '@activepieces/shared';
import { UIMessageChunk } from 'ai';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useSocket } from '@/components/providers/socket-provider';
import { chatDebug } from '@/lib/chat-debug-logger';

import { ChatUIMessage } from './chat-types';
import { chunkReducer, StreamingState } from './chunk-reducer';

const THROTTLE_MS = 100;
const STALE_CHECK_INTERVAL_MS = 15_000;

export function useStreamingReducer({
  onTitleUpdate,
  onToolProgress,
  onActionPreview,
  onActionReceipt,
  onImageGenerated,
  onFileProduced,
  onBuildPlan,
  onStreamFinished,
  onStreamError,
  onStaleCheck,
}: {
  onTitleUpdate: (title: string) => void;
  onToolProgress: (event: ToolProgressEvent) => void;
  onActionPreview: (event: ActionPreviewEvent) => void;
  onActionReceipt: (event: ActionReceiptEvent) => void;
  onImageGenerated: (event: ImageGeneratedEvent) => void;
  onFileProduced: (event: FileProducedEvent) => void;
  onBuildPlan: (event: BuildPlanEvent) => void;
  onStreamFinished: (conversationId: string) => void;
  onStreamError: (params: {
    conversationId: string;
    errorMessage: string;
    errorCode?: string;
  }) => void;
  onStaleCheck: (conversationId: string) => void;
}) {
  const socket = useSocket();

  const [streamingMessage, setStreamingMessage] =
    useState<ChatUIMessage | null>(null);
  const [streamPhase, setStreamPhase] = useState<StreamPhase>('idle');
  const [streamError, setStreamError] = useState<string | null>(null);
  const [isResumedStream, setIsResumedStream] = useState(false);

  const streamPhaseRef = useRef<StreamPhase>('idle');
  const streamGenerationRef = useRef(0);
  const reducerStateRef = useRef<StreamingState | null>(null);
  const chunkBufferRef = useRef<UIMessageChunk[]>([]);
  const throttleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  const onTitleUpdateRef = useRef(onTitleUpdate);
  onTitleUpdateRef.current = onTitleUpdate;
  const onToolProgressRef = useRef(onToolProgress);
  onToolProgressRef.current = onToolProgress;
  const onActionPreviewRef = useRef(onActionPreview);
  onActionPreviewRef.current = onActionPreview;
  const onActionReceiptRef = useRef(onActionReceipt);
  onActionReceiptRef.current = onActionReceipt;
  const onImageGeneratedRef = useRef(onImageGenerated);
  onImageGeneratedRef.current = onImageGenerated;
  const onFileProducedRef = useRef(onFileProduced);
  onFileProducedRef.current = onFileProduced;
  const onBuildPlanRef = useRef(onBuildPlan);
  onBuildPlanRef.current = onBuildPlan;
  const onStreamFinishedRef = useRef(onStreamFinished);
  onStreamFinishedRef.current = onStreamFinished;
  const onStreamErrorRef = useRef(onStreamError);
  onStreamErrorRef.current = onStreamError;
  const onStaleCheckRef = useRef(onStaleCheck);
  onStaleCheckRef.current = onStaleCheck;
  const staleCheckTimerRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );
  const lastChunkTimeRef = useRef(0);

  const updatePhase = useCallback((phase: StreamPhase) => {
    if (streamPhaseRef.current === phase) return;
    streamPhaseRef.current = phase;
    setStreamPhase(phase);
  }, []);

  const flush = useCallback(() => {
    throttleTimerRef.current = null;
    const chunks = chunkBufferRef.current;
    if (chunks.length === 0) return;
    chunkBufferRef.current = [];

    const state = reducerStateRef.current;
    if (!state) return;

    chunkReducer.applyChunks({ state, chunks });
    const snapshot = chunkReducer.snapshotMessage({ state });
    setStreamingMessage(snapshot);
    chatDebug.debug(
      {
        render: { kind: 'streaming-message' },
        partCount: snapshot.parts.length,
        appliedChunks: chunks.length,
      },
      'ui rendered streaming message',
    );
  }, []);

  const scheduleFlush = useCallback(() => {
    if (throttleTimerRef.current !== null) return;
    throttleTimerRef.current = setTimeout(flush, THROTTLE_MS);
  }, [flush]);

  const teardown = useCallback(() => {
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }
    if (throttleTimerRef.current !== null) {
      clearTimeout(throttleTimerRef.current);
      throttleTimerRef.current = null;
    }
    if (staleCheckTimerRef.current !== null) {
      clearInterval(staleCheckTimerRef.current);
      staleCheckTimerRef.current = null;
    }
    chunkBufferRef.current = [];
    reducerStateRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      teardown();
    };
  }, [teardown]);

  const activeRunIdRef = useRef<string | undefined>(undefined);

  const setActiveRunId = useCallback((runId: string) => {
    activeRunIdRef.current = runId;
    chatDebug.setContext({ run: { id: runId } });
  }, []);

  const startStream = useCallback(
    (
      conversationId: string,
      options?: {
        initialParts?: ChatUIMessage['parts'];
      },
    ) => {
      teardown();
      setIsResumedStream(!!options?.initialParts?.length);
      streamGenerationRef.current++;
      activeRunIdRef.current = undefined;
      chatDebug.setContext({ conversation: { id: conversationId } });
      chatDebug.info(
        {
          conversation: { id: conversationId },
          generation: streamGenerationRef.current,
        },
        'stream started',
      );

      lastChunkTimeRef.current = Date.now();
      reducerStateRef.current = chunkReducer.createStreamingState({
        initialParts: options?.initialParts,
      });
      const { message } = reducerStateRef.current;
      setStreamingMessage({
        id: message.id,
        role: 'assistant',
        parts: [...message.parts],
      });
      updatePhase('awaiting-stream');
      setStreamError(null);

      const handleFinish = () => {
        flush();
        teardown();
        updatePhase('reconciling');
        onStreamFinishedRef.current(conversationId);
      };

      const handleError = ({
        errorMessage,
        errorCode,
      }: {
        errorMessage: string;
        errorCode?: string;
      }) => {
        flush();
        teardown();
        setStreamError(errorMessage);
        updatePhase('reconciling');
        onStreamErrorRef.current({ conversationId, errorMessage, errorCode });
      };

      const expectedGeneration = streamGenerationRef.current;

      const handler = (event: SocketEvent) => {
        if (event.conversationId !== conversationId) {
          chatDebug.debug(
            {
              droppedReason: 'conversation-mismatch',
              eventConversationId: event.conversationId,
            },
            'ws event dropped',
          );
          return;
        }
        if (streamGenerationRef.current !== expectedGeneration) {
          chatDebug.debug(
            {
              droppedReason: 'stale-generation',
              expectedGeneration,
              currentGeneration: streamGenerationRef.current,
            },
            'ws event dropped',
          );
          return;
        }
        const runId = activeRunIdRef.current;
        if (runId && event.runId && event.runId !== runId) {
          chatDebug.debug(
            {
              droppedReason: 'run-mismatch',
              expectedRunId: runId,
              eventRunId: event.runId,
            },
            'ws event dropped',
          );
          return;
        }
        chatDebug.debug(
          {
            event: { type: event.type },
            chunkCount: Array.isArray(event.data)
              ? event.data.length
              : undefined,
          },
          'ws event received',
        );

        if (event.type === ChatAgentEventType.CHUNK) {
          updatePhase('streaming');
          lastChunkTimeRef.current = Date.now();
          const chunks = Array.isArray(event.data) ? event.data : [event.data];
          for (const chunk of chunks) {
            chunkBufferRef.current.push(chunk as UIMessageChunk);
          }
          scheduleFlush();
        } else if (event.type === ChatAgentEventType.ERROR) {
          const errorData = event.data as { message?: string; code?: string };
          handleError({
            errorMessage: errorData?.message ?? 'An error occurred',
            errorCode: errorData?.code,
          });
        } else if (event.type === ChatAgentEventType.FINISHED) {
          handleFinish();
        } else if (event.type === ChatAgentEventType.TITLE_UPDATE) {
          const titleData = event.data as { title?: string };
          if (titleData?.title) {
            onTitleUpdateRef.current(titleData.title);
          }
        } else if (event.type === ChatAgentEventType.TOOL_PROGRESS) {
          lastChunkTimeRef.current = Date.now();
          onToolProgressRef.current(event.data as ToolProgressEvent);
        } else if (event.type === ChatAgentEventType.ACTION_PREVIEW) {
          lastChunkTimeRef.current = Date.now();
          onActionPreviewRef.current(event.data as ActionPreviewEvent);
        } else if (event.type === ChatAgentEventType.ACTION_RECEIPT) {
          lastChunkTimeRef.current = Date.now();
          onActionReceiptRef.current(event.data as ActionReceiptEvent);
        } else if (event.type === ChatAgentEventType.IMAGE) {
          lastChunkTimeRef.current = Date.now();
          onImageGeneratedRef.current(event.data as ImageGeneratedEvent);
        } else if (event.type === ChatAgentEventType.FILE) {
          lastChunkTimeRef.current = Date.now();
          onFileProducedRef.current(event.data as FileProducedEvent);
        } else if (event.type === ChatAgentEventType.BUILD_PLAN) {
          lastChunkTimeRef.current = Date.now();
          onBuildPlanRef.current(event.data as BuildPlanEvent);
        }
      };

      socket.on(WebsocketClientEvent.CHAT_MESSAGE_CHUNK, handler);

      const reconnectHandler = () => {
        socket.off(WebsocketClientEvent.CHAT_MESSAGE_CHUNK, handler);
        socket.on(WebsocketClientEvent.CHAT_MESSAGE_CHUNK, handler);
        lastChunkTimeRef.current = Date.now();
      };
      socket.on('connect', reconnectHandler);

      // No unilateral client-side stall timeout: a live worker can legitimately
      // go quiet for minutes during a long tool/LLM step. The stale-check below
      // is the sole stall-teardown path — it is server-authoritative (settles
      // only when the conversation is no longer STREAMING), so a still-working
      // turn is never torn down, and a dead worker is reclaimed once the server
      // recovers the row to IDLE.
      staleCheckTimerRef.current = setInterval(() => {
        const timeSinceLastChunk = Date.now() - lastChunkTimeRef.current;
        if (timeSinceLastChunk < STALE_CHECK_INTERVAL_MS) return;
        onStaleCheckRef.current(conversationId);
      }, STALE_CHECK_INTERVAL_MS);

      cleanupRef.current = () => {
        socket.off(WebsocketClientEvent.CHAT_MESSAGE_CHUNK, handler);
        socket.off('connect', reconnectHandler);
      };
    },
    [socket, teardown, flush, scheduleFlush, updatePhase],
  );

  const stopStream = useCallback(() => {
    teardown();
    setStreamingMessage(null);
    setStreamError(null);
    updatePhase('idle');
  }, [teardown, updatePhase]);

  const clearStreamingState = useCallback(
    (generation?: number) => {
      if (
        generation !== undefined &&
        generation !== streamGenerationRef.current
      ) {
        return;
      }
      setStreamingMessage(null);
      setStreamError(null);
      updatePhase('idle');
    },
    [updatePhase],
  );

  return {
    streamingMessage,
    streamPhase,
    streamGeneration: streamGenerationRef,
    streamError,
    isResumedStream,
    startStream,
    setActiveRunId,
    stopStream,
    clearStreamingState,
  };
}

type SocketEvent = {
  conversationId: string;
  runId?: string;
  type: string;
  data: unknown;
};

type StreamPhase = 'idle' | 'awaiting-stream' | 'streaming' | 'reconciling';

export type { StreamPhase };
