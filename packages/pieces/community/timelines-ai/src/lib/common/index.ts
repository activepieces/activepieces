import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { PieceAuth } from '@activepieces/pieces-framework';
import {
  AuthenticationParams,
  CreateWebhookParams,
  CreateWebhookResponse,
  DeleteWebhookParams,
  DeleteWebhookResponse,
  GetChatsParams,
  GetChatsResponse,
  GetMessageParams,
  GetMessageResponse,
  GetUploadedFileParams,
  GetUploadedFileResponse,
  GetWhatsappAccountsResponse,
  ListUploadedFilesParams,
  ListUploadedFilesResponse,
  SendMessageToExistingChatParams,
  SendMessageToExistingChatResponse,
  SendMessageToJidParams,
  SendMessageToJidResponse,
  SendMessageToPhoneNumberParams,
  SendMessageToPhoneNumberResponse,
  UpdateChatParams,
  UpdateChatResponse,
  UploadFileParams,
  UploadFileResponse,
} from './types';

export const timelinesAiAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: 'Your TimelinesAI API key.',
  required: true,
});

export const timelinesAiCommon = {
  baseUrl: 'https://app.timelines.ai/integrations/api',
  getHeaders: (apiKey: string) => ({ Authorization: `Bearer ${apiKey}` }),
  endpoints: {
    sendMessageToExistingChat: (chat_id: number) =>
      `/chats/${chat_id}/messages`,
    sendMessageToPhoneNumber: '/messages',
    sendMessageToJid: '/messages/to_jid',
    updateChat: (chat_id: string) => `/chats/${chat_id}`,
    getChats: '/chats',
    getMessage: (message_id: string) => `/messages/${message_id}`,
    getUploadedFile: (file_id: string) => `/files/${file_id}`,
    listUploadedFiles: '/files',
    getWhatsappAccounts: '/whatsapp_accounts',
    uploadFile: '/files_upload',
    createWebhook: '/webhooks',
    deleteWebhook: (webhook_id: number) => `/webhooks/${webhook_id}`,
  },
  // API Calls
  sendMessageToExistingChat: async ({
    apiKey,
    ...messageParams
  }: SendMessageToExistingChatParams) => {
    const response =
      await httpClient.sendRequest<SendMessageToExistingChatResponse>({
        method: HttpMethod.POST,
        url:
          timelinesAiCommon.baseUrl +
          timelinesAiCommon.endpoints.sendMessageToExistingChat(
            messageParams.chat_id
          ),
        headers: timelinesAiCommon.getHeaders(apiKey),
        body: messageParams,
      });
    return response.body;
  },
  sendMessageToPhoneNumber: async ({
    apiKey,
    ...messageParams
  }: SendMessageToPhoneNumberParams) => {
    const response =
      await httpClient.sendRequest<SendMessageToPhoneNumberResponse>({
        method: HttpMethod.POST,
        url:
          timelinesAiCommon.baseUrl +
          timelinesAiCommon.endpoints.sendMessageToPhoneNumber,
        headers: timelinesAiCommon.getHeaders(apiKey),
        body: messageParams,
      });
    return response.body;
  },
  sendMessageToJid: async ({
    apiKey,
    ...messageParams
  }: SendMessageToJidParams) => {
    const response = await httpClient.sendRequest<SendMessageToJidResponse>({
      method: HttpMethod.POST,
      url:
        timelinesAiCommon.baseUrl +
        timelinesAiCommon.endpoints.sendMessageToJid,
      headers: timelinesAiCommon.getHeaders(apiKey),
      body: messageParams,
    });
    return response.body;
  },
  updateChat: async ({ apiKey, ...chatParams }: UpdateChatParams) => {
    const response = await httpClient.sendRequest<UpdateChatResponse>({
      method: HttpMethod.PATCH,
      url:
        timelinesAiCommon.baseUrl +
        timelinesAiCommon.endpoints.updateChat(chatParams.chat_id.toString()),
      headers: timelinesAiCommon.getHeaders(apiKey),
      body: chatParams,
    });
    return response.body;
  },
  getChats: async ({ apiKey, ...chatParams }: GetChatsParams) => {
    const { group, read, closed, chatgpt_autoresponse_enabled, page, ...rest } =
      chatParams;
    const queryParams = {
      ...(group !== undefined ? { group: group.toString() } : {}),
      ...(read !== undefined ? { read: read.toString() } : {}),
      ...(closed !== undefined ? { closed: closed.toString() } : {}),
      ...(chatgpt_autoresponse_enabled !== undefined
        ? {
            chatgpt_autoresponse_enabled:
              chatgpt_autoresponse_enabled.toString(),
          }
        : {}),
      ...(page !== undefined ? { page: page.toString() } : {}),
      ...rest,
    };
    const response = await httpClient.sendRequest<GetChatsResponse>({
      method: HttpMethod.GET,
      url: timelinesAiCommon.baseUrl + timelinesAiCommon.endpoints.getChats,
      headers: timelinesAiCommon.getHeaders(apiKey),
      queryParams,
    });
    return response.body;
  },
  getMessage: async ({ apiKey, message_uid }: GetMessageParams) => {
    const response = await httpClient.sendRequest<GetMessageResponse>({
      method: HttpMethod.GET,
      url:
        timelinesAiCommon.baseUrl +
        timelinesAiCommon.endpoints.getMessage(message_uid),
      headers: timelinesAiCommon.getHeaders(apiKey),
    });
    return response.body;
  },
  getUploadedFile: async ({ apiKey, file_uid }: GetUploadedFileParams) => {
    const response = await httpClient.sendRequest<GetUploadedFileResponse>({
      method: HttpMethod.GET,
      url:
        timelinesAiCommon.baseUrl +
        timelinesAiCommon.endpoints.getUploadedFile(file_uid),
      headers: timelinesAiCommon.getHeaders(apiKey),
    });
    return response.body;
  },
  listUploadedFiles: async ({ apiKey, filename }: ListUploadedFilesParams) => {
    const response = await httpClient.sendRequest<ListUploadedFilesResponse>({
      method: HttpMethod.GET,
      url: timelinesAiCommon.baseUrl + timelinesAiCommon.endpoints.listUploadedFiles,
      headers: timelinesAiCommon.getHeaders(apiKey),
      queryParams: {
        ...(filename ? { filename } : {}),
      },
    });
    return response.body;
  },
  listWhatsappAccounts: async ({ apiKey }: AuthenticationParams) => {
    const response = await httpClient.sendRequest<GetWhatsappAccountsResponse>({
      method: HttpMethod.GET,
      url:
        timelinesAiCommon.baseUrl +
        timelinesAiCommon.endpoints.getWhatsappAccounts,
      headers: timelinesAiCommon.getHeaders(apiKey),
    });
    return response.body;
  },
  uploadFile: async ({ apiKey, ...fileParams }: UploadFileParams) => {
    const { file, filename, content_type } = fileParams;
    const formData = new FormData();
    const uint8 = new Uint8Array(file);
    const blob = new Blob([uint8], {
      type: content_type || 'application/octet-stream',
    });
    formData.append('file', blob, filename || 'upload');
    if (filename) {
      formData.append('filename', filename);
    }
    if (content_type) {
      formData.append('content_type', content_type);
    }

    const response = await httpClient.sendRequest<UploadFileResponse>({
      method: HttpMethod.POST,
      url: timelinesAiCommon.baseUrl + timelinesAiCommon.endpoints.uploadFile,
      headers: {
        ...timelinesAiCommon.getHeaders(apiKey),
        'Content-Type': 'multipart/form-data',
      },
      body: formData,
    });
    return response.body;
  },
  createWebhook: async ({ apiKey, ...webhookParams }: CreateWebhookParams) => {
    const response = await httpClient.sendRequest<CreateWebhookResponse>({
      method: HttpMethod.POST,
      url:
        timelinesAiCommon.baseUrl + timelinesAiCommon.endpoints.createWebhook,
      headers: timelinesAiCommon.getHeaders(apiKey),
      body: webhookParams,
    });
    return response.body;
  },
  deleteWebhook: async ({ apiKey, webhook_id }: DeleteWebhookParams) => {
    const response = await httpClient.sendRequest<DeleteWebhookResponse>({
      method: HttpMethod.DELETE,
      url:
        timelinesAiCommon.baseUrl +
        timelinesAiCommon.endpoints.deleteWebhook(webhook_id),
      headers: timelinesAiCommon.getHeaders(apiKey),
    });
    return response.body;
  },
};
