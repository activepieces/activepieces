import { api } from '@/lib/api';
import { Chat } from '@activepieces/shared';

export const chatApi = {
  sendMessage: (flowId: string, chatId: string, message: string) => {
    return api.post<Chat | null>(
      `/v1/webhooks/${flowId}/sync`,
      {
        chatId,
        message,
      },
    );
  },
};
