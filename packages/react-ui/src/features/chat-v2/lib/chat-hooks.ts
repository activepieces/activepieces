import { useMutation } from '@tanstack/react-query';

import { useSocket } from '@/components/socket-provider';
import { internalErrorToast } from '@/components/ui/sonner';
import { api } from '@/lib/api';
import {
  ChatFileAttachment,
  ChatSession,
  ChatSessionEnded,
  ChatSessionUpdate,
  chatSessionUtils,
  WebsocketClientEvent,
} from '@activepieces/shared';

import { UploadingFile } from '../prompt-input/file-input-preview';

export const uploadFile = async (file: File): Promise<string | undefined> => {
  const formData = new FormData();
  formData.append('file', file, file.name);
  const response = await api.any<{ url?: string }>(
    '/v1/chat-sessions/attachments',
    {
      method: 'POST',
      data: formData,
    },
  );
  return response.url;
};

const convertUploadingFilesToAttachments = (
  uploadingFiles: UploadingFile[],
): ChatFileAttachment[] => {
  return uploadingFiles
    .filter((f) => f.status === 'completed' && f.url)
    .map((f) => ({
      name: f.file.name,
      mimeType: f.file.type,
      url: f.url!,
    }));
};

export const chatHooks = {
  useSendMessage(setSession: (session: ChatSession) => void) {
    const socket = useSocket();
    return useMutation<
      ChatSession,
      Error,
      {
        message: string;
        uploadingFiles?: UploadingFile[];
        currentSession: ChatSession | null;
      }
    >({
      mutationFn: async (request) => {
        let currentSession =
          request.currentSession ??
          (await api.post<ChatSession>('/v1/chat-sessions', {}));

        // Convert already-uploaded files to attachments
        const uploadedFiles = request.uploadingFiles
          ? convertUploadingFilesToAttachments(request.uploadingFiles)
          : undefined;

        const filesForDisplay = uploadedFiles?.map((file) => ({
          name: file.name,
          type: file.mimeType,
          url: file.url,
        }));
        currentSession = chatSessionUtils.addUserMessage(
          currentSession,
          request.message,
          filesForDisplay,
        );
        currentSession =
          chatSessionUtils.addEmptyAssistantMessage(currentSession);
        setSession(currentSession);
        await api.post<ChatSession>(
          `/v1/chat-sessions/${currentSession.id}/chat`,
          {
            message: request.message,
            files: uploadedFiles,
          },
        );
        return new Promise((resolve) => {
          socket.on(
            WebsocketClientEvent.AGENT_STREAMING_UPDATE,
            (data: ChatSessionUpdate) => {
              if (data.sessionId !== currentSession.id) {
                return;
              }
              currentSession = chatSessionUtils.streamChunk(currentSession, data);
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
        update: Partial<ChatSession>;
      }
    >({
      mutationFn: async ({ currentSession, update }) => {
        let session =
          currentSession ??
          (await api.post<ChatSession>('/v1/chat-sessions', {}));

        session = await api.post<ChatSession>(
          `/v1/chat-sessions/${session.id}/update`,
          { session: update },
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
