import { useMutation } from '@tanstack/react-query';

import { internalErrorToast } from '@/components/ui/sonner';
import { api } from '@/lib/api';
import {
  AgentStreamingEvent,
  AgentStreamingUpdate,
  ChatFileAttachment,
  ChatSession,
  Conversation,
  genericAgentUtils,
} from '@activepieces/shared';

import { UploadingFile } from '../prompt-input/file-input-preview';
import { readStream } from '@/lib/read-stream';

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

const updateChatSessionConversation = (session: ChatSession, conversation: Conversation): ChatSession => {
  return {
    ...session,
    conversation,
  }
}

export const chatHooks = {
  useSendMessage(setSession: (session: ChatSession) => void) {
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
        currentSession = updateChatSessionConversation(currentSession, genericAgentUtils.addUserMessage(
          currentSession.conversation ?? [],
          request.message,
          filesForDisplay,
        ));
        currentSession = updateChatSessionConversation(currentSession, genericAgentUtils.addEmptyAssistantMessage(currentSession.conversation ?? []));

        setSession(currentSession);
        const response = await api.post(
          `/v1/chat-sessions/${currentSession.id}/chat`,
          {
            message: request.message,
            files: uploadedFiles,
          },
          undefined,
          undefined,
          'stream'
        );
        return new Promise((resolve) => {
          readStream({
            response: response as { body: ReadableStream<Uint8Array> },
            onChunk: (chunk) => {
              try {
                const messageJson = JSON.parse(chunk) as AgentStreamingUpdate
                if (messageJson.event === AgentStreamingEvent.AGENT_STREAMING_UPDATE) {
                  currentSession = updateChatSessionConversation(currentSession, genericAgentUtils.streamChunk(currentSession.conversation ?? [], messageJson.data));
                  setSession(currentSession);
                } else if (messageJson.event === AgentStreamingEvent.AGENT_STREAMING_ENDED) {
                  setSession(currentSession);
                  resolve(currentSession);
                }
              } catch (error) {}
            },
            onEnd: () => {
              resolve(currentSession);
            },
          });
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
          update,
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
