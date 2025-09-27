import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { TimelinesaiAuth } from './auth';

const TIMELINESAI_API_URL = 'https://app.timelines.ai/integrations/api';

export const timelinesaiCommon = {
  baseUrl: TIMELINESAI_API_URL,

  baseHeaders: (apiKey: string) => ({
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  }),

  async apiCall<T = any>({
    auth,
    method,
    endpoint,
    body,
    queryParams,
  }: {
    auth: TimelinesaiAuth;
    method: HttpMethod;
    endpoint: string;
    body?: any;
    queryParams?: Record<string, string | number | boolean>;
  }): Promise<T> {
    const stringQueryParams: Record<string, string> = {};
    if (queryParams) {
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          stringQueryParams[key] = String(value);
        }
      });
    }

    try {
      const response = await httpClient.sendRequest({
        method,
        url: `${TIMELINESAI_API_URL}${endpoint}`,
        headers: this.baseHeaders(auth.api_key),
        body,
        queryParams: Object.keys(stringQueryParams).length > 0 ? stringQueryParams : undefined,
      });

      return response.body as T;
    } catch (error: any) {
      throw new Error(`TimelinesAI API error: ${error.message || 'Unknown error'}`);
    }
  },

  getChats: async ({ auth, ...params }: { auth: TimelinesaiAuth } & {
    limit?: number;
    offset?: number;
    whatsapp_account_id?: string;
    status?: string;
  }) => {
    return timelinesaiCommon.apiCall({
      auth,
      method: HttpMethod.GET,
      endpoint: '/chats',
      queryParams: params,
    });
  },

  getChat: async ({ auth, chatId }: { auth: TimelinesaiAuth; chatId: string }) => {
    return timelinesaiCommon.apiCall({
      auth,
      method: HttpMethod.GET,
      endpoint: `/chats/${chatId}`,
    });
  },

  closeChat: async ({ auth, chatId }: { auth: TimelinesaiAuth; chatId: string }) => {
    return timelinesaiCommon.apiCall({
      auth,
      method: HttpMethod.POST,
      endpoint: `/chats/${chatId}/close`,
    });
  },

  sendMessage: async ({ auth, chatId, ...messageData }: { auth: TimelinesaiAuth; chatId: string } & {
    content: string;
    message_type?: string;
  }) => {
    return timelinesaiCommon.apiCall({
      auth,
      method: HttpMethod.POST,
      endpoint: `/chats/${chatId}/messages`,
      body: messageData,
    });
  },

  getMessages: async ({ auth, chatId, ...params }: { auth: TimelinesaiAuth; chatId: string } & {
    limit?: number;
    offset?: number;
  }) => {
    return timelinesaiCommon.apiCall({
      auth,
      method: HttpMethod.GET,
      endpoint: `/chats/${chatId}/messages`,
      queryParams: params,
    });
  },

  getMessage: async ({ auth, messageId }: { auth: TimelinesaiAuth; messageId: string }) => {
    return timelinesaiCommon.apiCall({
      auth,
      method: HttpMethod.GET,
      endpoint: `/messages/${messageId}`,
    });
  },

  getMessageStatus: async ({ auth, messageId }: { auth: TimelinesaiAuth; messageId: string }) => {
    return timelinesaiCommon.apiCall({
      auth,
      method: HttpMethod.GET,
      endpoint: `/messages/${messageId}/status`,
    });
  },

  uploadFile: async ({ auth, chatId, ...fileData }: { auth: TimelinesaiAuth; chatId: string } & any) => {
    return timelinesaiCommon.apiCall({
      auth,
      method: HttpMethod.POST,
      endpoint: `/chats/${chatId}/files`,
      body: fileData,
    });
  },

  getFiles: async ({ auth, chatId, ...params }: { auth: TimelinesaiAuth; chatId: string } & {
    limit?: number;
    offset?: number;
  }) => {
    return timelinesaiCommon.apiCall({
      auth,
      method: HttpMethod.GET,
      endpoint: `/chats/${chatId}/files`,
      queryParams: params,
    });
  },

  getFile: async ({ auth, fileId }: { auth: TimelinesaiAuth; fileId: string }) => {
    return timelinesaiCommon.apiCall({
      auth,
      method: HttpMethod.GET,
      endpoint: `/files/${fileId}`,
    });
  },

  getWhatsAppAccounts: async ({ auth }: { auth: TimelinesaiAuth }) => {
    return timelinesaiCommon.apiCall({
      auth,
      method: HttpMethod.GET,
      endpoint: '/whatsapp-accounts',
    });
  },

  getWhatsAppAccount: async ({ auth, accountId }: { auth: TimelinesaiAuth; accountId: string }) => {
    return timelinesaiCommon.apiCall({
      auth,
      method: HttpMethod.GET,
      endpoint: `/whatsapp-accounts/${accountId}`,
    });
  },

  sendMessageToExistingChat: async ({ auth, chatId, message, messageType = 'text' }: {
    auth: TimelinesaiAuth;
    chatId: string;
    message: string;
    messageType?: string;
  }) => {
    return timelinesaiCommon.sendMessage({
      auth,
      chatId,
      content: message,
      message_type: messageType,
    });
  },

  sendFileToExistingChat: async ({ auth, chatId, ...fileData }: {
    auth: TimelinesaiAuth;
    chatId: string;
  } & any) => {
    return timelinesaiCommon.uploadFile({ auth, chatId, ...fileData });
  },

  sendMessageToNewChat: async ({ auth, whatsappAccountId, phoneNumber, message, messageType = 'text' }: {
    auth: TimelinesaiAuth;
    whatsappAccountId: string;
    phoneNumber: string;
    message: string;
    messageType?: string;
  }) => {
    return timelinesaiCommon.apiCall({
      auth,
      method: HttpMethod.POST,
      endpoint: '/messages',
      body: {
        whatsapp_account_id: whatsappAccountId,
        phone_number: phoneNumber,
        content: message,
        message_type: messageType,
      },
    });
  },

  closeChatById: async ({ auth, chatId }: { auth: TimelinesaiAuth; chatId: string }) => {
    return timelinesaiCommon.closeChat({ auth, chatId });
  },

  findChatById: async ({ auth, chatId }: { auth: TimelinesaiAuth; chatId: string }) => {
    return timelinesaiCommon.getChat({ auth, chatId });
  },

  findChatsByCriteria: async ({ auth, ...criteria }: { auth: TimelinesaiAuth } & any) => {
    return timelinesaiCommon.getChats({ auth, ...criteria });
  },

  findMessageById: async ({ auth, messageId }: { auth: TimelinesaiAuth; messageId: string }) => {
    return timelinesaiCommon.getMessage({ auth, messageId });
  },

  findMessageStatusById: async ({ auth, messageId }: { auth: TimelinesaiAuth; messageId: string }) => {
    return timelinesaiCommon.getMessageStatus({ auth, messageId });
  },

  findFilesByCriteria: async ({ auth, chatId, ...criteria }: {
    auth: TimelinesaiAuth;
    chatId: string;
  } & { limit?: number; offset?: number }) => {
    return timelinesaiCommon.getFiles({ auth, chatId, ...criteria });
  },

  findFileById: async ({ auth, fileId }: { auth: TimelinesaiAuth; fileId: string }) => {
    return timelinesaiCommon.getFile({ auth, fileId });
  },

  findWhatsAppAccountsByCriteria: async ({ auth, ...criteria }: { auth: TimelinesaiAuth } & any) => {
    const accounts = await timelinesaiCommon.getWhatsAppAccounts({ auth }) as any[];
    if (criteria.whatsapp_account_id) {
      return accounts.filter((account: any) => account.id === criteria.whatsapp_account_id);
    }
    if (criteria.phone_number) {
      return accounts.filter((account: any) => account.phone_number === criteria.phone_number);
    }
    return accounts;
  },
};
