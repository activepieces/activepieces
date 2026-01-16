import { useMutation } from '@tanstack/react-query';

import { useSocket } from '@/components/socket-provider';
import { internalErrorToast } from '@/components/ui/sonner';
import { api } from '@/lib/api';
import {
  ChatSession,
  ChatSessionEnded,
  ChatSessionUpdate,
  chatSessionUtils,
  isNil,
  WebsocketClientEvent,
} from '@activepieces/shared';

export const chatHooks = {
  useSendMessage(setSession: (session: ChatSession) => void) {
    const socket = useSocket();
    return useMutation<
      ChatSession,
      Error,
      { message: string; sessionId: string | null }
    >({
      mutationFn: async (request) => {
        let chatWithSessionId = request.sessionId;
        if (isNil(request.sessionId)) {
          const createSession = await api.post<ChatSession>(
            '/v1/chat-sessions',
            {},
          );
          chatWithSessionId = createSession.id;
        }
        let currentSession = await api.post<ChatSession>(
          `/v1/chat-sessions/${chatWithSessionId}/chat`,
          {
            message: request.message,
          },
        );
        return new Promise((resolve) => {
          socket.on(
            WebsocketClientEvent.AGENT_STREAMING_UPDATE,
            (data: ChatSessionUpdate) => {
              if (data.sessionId !== chatWithSessionId) {
                return;
              }
              currentSession = chatSessionUtils.streamChunk(currentSession, {
                sessionId: chatWithSessionId,
                part: data.part,
              });
              setSession(currentSession);
            },
          );
          socket.on(
            WebsocketClientEvent.AGENT_STREAMING_ENDED,
            (data: ChatSessionEnded) => {
              if (data.sessionId !== chatWithSessionId) {
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
};
