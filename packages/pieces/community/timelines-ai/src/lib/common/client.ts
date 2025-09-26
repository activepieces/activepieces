import {
  HttpMethod,
  HttpMessageBody,
  httpClient,
} from '@activepieces/pieces-common';
import { Buffer } from 'node:buffer';
import {
  TimelinesAiAuthType,
  Chat,
  FindChatRequest,
  GetMessageResponse,
  MessageStatus,
  FindFileRequest,
  GetFilesResponse,
  GetFileResponse,
  SendMessageRequest,
  SendMessageResponse,
  UploadFileByUrlRequest,
  UploadFileResponse,
  UploadFileByFormDataResponse,
  WhatsAppAccount,
  SendMessageToNewChatRequest,
  UpdateChatRequest,
  UpdateChatResponse,
} from './types';

const TIMELINES_API_URL = 'https://app.timelines.ai/integrations/api';

export const timelinesAiClient = {
  async getChats(auth: TimelinesAiAuthType): Promise<Chat[]> {
    const response = await httpClient.sendRequest<Chat[]>({
      method: HttpMethod.GET,
      url: `${TIMELINES_API_URL}/chats`,
      headers: {
        Authorization: `Bearer ${auth}`,
      },
    });
    return response.body;
  },

  async uploadFileByUrl(
    auth: TimelinesAiAuthType,
    payload: UploadFileByUrlRequest
  ): Promise<UploadFileResponse> {
    const response = await httpClient.sendRequest<UploadFileResponse>({
      method: HttpMethod.POST,
      url: `${TIMELINES_API_URL}/files`,
      headers: {
        Authorization: `Bearer ${auth}`,
      },
      body: payload,
    });
    return response.body;
  },

  async uploadFileByContent(
    auth: TimelinesAiAuthType,
    file: { filename: string; data: Buffer }
  ): Promise<UploadFileByFormDataResponse> {
    const body: HttpMessageBody = {
      file: {
        value: file.data,
        filename: file.filename,
      },
    };
    const response = await httpClient.sendRequest<UploadFileByFormDataResponse>(
      {
        method: HttpMethod.POST,
        url: `${TIMELINES_API_URL}/files/upload`,
        body: body,
        headers: {
          Authorization: `Bearer ${auth}`,
        },
      }
    );
    return response.body;
  },

  async getWhatsAppAccounts(
    auth: TimelinesAiAuthType
  ): Promise<WhatsAppAccount[]> {
    const response = await httpClient.sendRequest<WhatsAppAccount[]>({
      method: HttpMethod.GET,
      url: `${TIMELINES_API_URL}/whatsapp_accounts`,
      headers: {
        Authorization: `Bearer ${auth}`,
      },
    });
    return response.body;
  },

  async sendMessageToNewChat(
    auth: TimelinesAiAuthType,
    payload: SendMessageToNewChatRequest
  ): Promise<SendMessageResponse> {
    const response = await httpClient.sendRequest<SendMessageResponse>({
      method: HttpMethod.POST,
      url: `${TIMELINES_API_URL}/chats/send`,
      headers: {
        Authorization: `Bearer ${auth}`,
      },
      body: payload,
    });
    return response.body;
  },

  async sendMessage(
    auth: TimelinesAiAuthType,
    chatId: number,
    payload: SendMessageRequest
  ): Promise<SendMessageResponse> {
    const response = await httpClient.sendRequest<SendMessageResponse>({
      method: HttpMethod.POST,
      url: `${TIMELINES_API_URL}/chats/${chatId}/messages`,
      headers: {
        Authorization: `Bearer ${auth}`,
      },
      body: payload,
    });
    return response.body;
  },

  async getMessageById(
    auth: TimelinesAiAuthType,
    messageUid: string
  ): Promise<GetMessageResponse> {
    const response = await httpClient.sendRequest<GetMessageResponse>({
      method: HttpMethod.GET,
      url: `${TIMELINES_API_URL}/messages/${messageUid}`,
      headers: {
        Authorization: `Bearer ${auth}`,
      },
    });
    return response.body;
  },

  async updateChatState(
    auth: TimelinesAiAuthType,
    chatId: number,
    payload: UpdateChatRequest
  ): Promise<UpdateChatResponse> {
    const response = await httpClient.sendRequest<UpdateChatResponse>({
      method: HttpMethod.PATCH,
      url: `${TIMELINES_API_URL}/chats/${chatId}`,
      headers: {
        Authorization: `Bearer ${auth}`,
      },
      body: payload,
    });
    return response.body;
  },

  async findChat(
    auth: TimelinesAiAuthType,
    params: FindChatRequest
  ): Promise<Chat[]> {
    const response = await httpClient.sendRequest<Chat[]>({
      method: HttpMethod.GET,
      url: `${TIMELINES_API_URL}/chats`,
      headers: {
        Authorization: `Bearer ${auth}`,
      },
      queryParams: params as Record<string, string>,
    });
    return response.body;
  },

  async getFileById(
    auth: TimelinesAiAuthType,
    fileUid: string
  ): Promise<GetFileResponse> {
    const response = await httpClient.sendRequest<GetFileResponse>({
      method: HttpMethod.GET,
      url: `${TIMELINES_API_URL}/files/${fileUid}`,
      headers: {
        Authorization: `Bearer ${auth}`,
      },
    });
    return response.body;
  },

  async findFiles(
    auth: TimelinesAiAuthType,
    params: FindFileRequest
  ): Promise<GetFilesResponse> {
    const response = await httpClient.sendRequest<GetFilesResponse>({
      method: HttpMethod.GET,
      url: `${TIMELINES_API_URL}/files`,
      headers: {
        Authorization: `Bearer ${auth}`,
      },
      queryParams: params as Record<string, string>,
    });
    return response.body;
  },

  async getMessageStatusHistory(
    auth: TimelinesAiAuthType,
    messageUid: string
  ): Promise<MessageStatus[]> {
    const response = await httpClient.sendRequest<MessageStatus[]>({
      method: HttpMethod.GET,
      url: `${TIMELINES_API_URL}/messages/${messageUid}/status_history`,
      headers: {
        Authorization: `Bearer ${auth}`,
      },
    });
    return response.body;
  },
};
