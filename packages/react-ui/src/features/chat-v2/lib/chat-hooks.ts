import { useMutation } from '@tanstack/react-query';

import { useSocket } from '@/components/socket-provider';
import { internalErrorToast } from '@/components/ui/sonner';
import { api } from '@/lib/api';
import {
  ChatSession,
  ChatSessionEnded,
  ChatSessionUpdate,
  chatSessionUtils,
  WebsocketClientEvent,
} from '@activepieces/shared';

export const chatHooks = {
  useSendMessage(setSession: (session: ChatSession) => void) {
    const socket = useSocket();
    return useMutation<
      ChatSession,
      Error,
      { message: string; currentSession: ChatSession | null }
    >({
      mutationFn: async (request) => {
        let currentSession =
          request.currentSession ??
          (await api.post<ChatSession>('/v1/chat-sessions', {}));
        currentSession = chatSessionUtils.addUserMessage(
          currentSession,
          request.message,
        );
        currentSession =
          chatSessionUtils.addEmptyAssistantMessage(currentSession);
        setSession(currentSession);
        await api.post<ChatSession>(
          `/v1/chat-sessions/${currentSession.id}/chat`,
          {
            message: request.message,
          },
        );
        return new Promise((resolve) => {
          socket.on(
            WebsocketClientEvent.AGENT_STREAMING_UPDATE,
            (data: ChatSessionUpdate) => {
              if (data.sessionId !== currentSession.id) {
                return;
              }
              currentSession = chatSessionUtils.streamChunk(currentSession, {
                sessionId: currentSession.id,
                part: data.part,
              });
              currentSession.plan = data.plan;
              setSession(currentSession);
            },
          );
          socket.on(
            WebsocketClientEvent.AGENT_STREAMING_ENDED,
            (data: ChatSessionEnded) => {
              if (data.sessionId !== currentSession.id) {
                return;
              }
              socket.off(WebsocketClientEvent.AGENT_STREAMING_UPDATE);
              socket.off(WebsocketClientEvent.AGENT_STREAMING_ENDED);
              setSession(currentSession);
              resolve(currentSession);
            },
          );
        });
      },
      onError: (error) => {
        internalErrorToast();
        console.error(error);
      },
    });
  },
  useUpdateChatSession(setSession: (session: ChatSession) => void) {
    return useMutation<
      ChatSession,
      Error,
      {
        currentSession: ChatSession | null;
        modelId?: string;
        webSearchEnabled?: boolean;
        codeExecutionEnabled?: boolean;
      }
    >({
      mutationFn: async ({ currentSession, modelId, webSearchEnabled, codeExecutionEnabled }) => {
        let session =
          currentSession ??
          (await api.post<ChatSession>('/v1/chat-sessions', {}));

        session = await api.patch<ChatSession>(
          `/v1/chat-sessions/${session.id}`,
          { modelId, webSearchEnabled, codeExecutionEnabled },
        );

        setSession(session);
        return session;
      },
      onError: (error) => {
        internalErrorToast();
        console.error(error);
      },
    });
  },
  useDeleteChatSession(setSession: (session: ChatSession | null) => void) {
    return useMutation<
      void,
      Error,
      {
        currentSession: ChatSession | null;
      }
    >({
      mutationFn: async ({ currentSession }) => {
        const session =
          currentSession ??
          (await api.post<ChatSession>('/v1/chat-sessions', {}));

        await api.delete(`/v1/chat-sessions/${session.id}`);

        setSession(null);
      },
      onError: (error) => {
        internalErrorToast();
        console.error(error);
      },
    });
  },
};
