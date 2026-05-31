import { ChatAgentEventType, WebsocketClientEvent } from '@activepieces/shared';
import { UIMessageChunk } from 'ai';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useSocket } from '@/components/providers/socket-provider';

import { ChatUIMessage } from './chat-types';
import { chunkReducer, DataPart, StreamingState } from './chunk-reducer';

const THROTTLE_MS = 100;
const STREAM_TIMEOUT_MS = 10 * 60 * 1000;
const STALE_CHECK_INTERVAL_MS = 15_000;

export function useStreamingReducer({
  onDataPart,
  onStreamFinished,
  onStreamError,
  onStaleCheck,
}: {
  onDataPart: (part: DataPart) => void;
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

  const streamPhaseRef = useRef<StreamPhase>('idle');
  const reducerStateRef = useRef<StreamingState | null>(null);
  const chunkBufferRef = useRef<UIMessageChunk[]>([]);
  const throttleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const streamTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  const onDataPartRef = useRef(onDataPart);
  onDataPartRef.current = onDataPart;
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

    const dataParts = chunkReducer.extractDataParts({ chunks });
    for (const dp of dataParts) {
      onDataPartRef.current(dp);
    }

    const state = reducerStateRef.current;
    if (!state) return;

    chunkReducer.applyChunks({ state, chunks });
    setStreamingMessage(chunkReducer.snapshotMessage({ state }));
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
    if (streamTimeoutRef.current !== null) {
      clearTimeout(streamTimeoutRef.current);
      streamTimeoutRef.current = null;
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

  const startStream = useCallback(
    (conversationId: string) => {
      teardown();

      reducerStateRef.current = chunkReducer.createStreamingState();
      setStreamingMessage({
        id: reducerStateRef.current.message.id,
        role: 'assistant',
        parts: [],
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

      const handler = (event: SocketEvent) => {
        if (event.conversationId !== conversationId) return;

        if (event.type === ChatAgentEventType.CHUNK) {
          updatePhase('streaming');
          lastChunkTimeRef.current = Date.now();
          const chunks = Array.isArray(event.data) ? event.data : [event.data];
          for (const chunk of chunks) {
            chunkBufferRef.current.push(chunk as UIMessageChunk);
          }
          scheduleFlush();

          if (streamTimeoutRef.current !== null) {
            clearTimeout(streamTimeoutRef.current);
          }
          streamTimeoutRef.current = setTimeout(() => {
            handleError({ errorMessage: 'Stream timed out' });
          }, STREAM_TIMEOUT_MS);
        } else if (event.type === ChatAgentEventType.ERROR) {
          const errorData = event.data as { message?: string; code?: string };
          handleError({
            errorMessage: errorData?.message ?? 'An error occurred',
            errorCode: errorData?.code,
          });
        } else if (event.type === ChatAgentEventType.FINISHED) {
          handleFinish();
        }
      };

      socket.on(WebsocketClientEvent.CHAT_MESSAGE_CHUNK, handler);

      streamTimeoutRef.current = setTimeout(() => {
        handleError({ errorMessage: 'Stream timed out' });
      }, STREAM_TIMEOUT_MS);

      staleCheckTimerRef.current = setInterval(() => {
        const timeSinceLastChunk = Date.now() - lastChunkTimeRef.current;
        if (timeSinceLastChunk < STALE_CHECK_INTERVAL_MS) return;
        onStaleCheckRef.current(conversationId);
      }, STALE_CHECK_INTERVAL_MS);

      cleanupRef.current = () => {
        socket.off(WebsocketClientEvent.CHAT_MESSAGE_CHUNK, handler);
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

  const clearStreamingState = useCallback(() => {
    setStreamingMessage(null);
    setStreamError(null);
    updatePhase('idle');
  }, [updatePhase]);

  return {
    streamingMessage,
    streamPhase,
    streamError,
    startStream,
    stopStream,
    clearStreamingState,
  };
}

type SocketEvent = {
  conversationId: string;
  type: string;
  data: unknown;
};

type StreamPhase = 'idle' | 'awaiting-stream' | 'streaming' | 'reconciling';

export type { StreamPhase };
