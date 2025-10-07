import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import * as fs from 'fs';
import FormData from 'form-data';
import {
  CreateChatbotDto,
  SendMessageDto,
  RetrainOptions,
  Chatbot,
  Message,
  RetrainJob,
  RetrainJobStatus,
  FileMeta,
  WebhookSubscription,
  EventList,
  UpdateChatbotSettingsDto,
} from './types';

export class ChatDataClient {
  private baseURL: string;
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env['CHATDATA_API_KEY'] || '';
    if (!this.apiKey) {
      throw new Error('CHATDATA_API_KEY environment variable is required');
    }

    this.baseURL =
      process.env['CHATDATA_BASE_URL'] || 'https://api.chat-data.com/v1';
  }

  private getHeaders() {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };
  }

  private handleError(error: any): Error {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.body || error.response.data;

      switch (status) {
        case 401:
          return new Error('Invalid API key');
        case 403:
          return new Error('Insufficient permissions');
        case 422:
          const details =
            data?.message || data?.error || 'Invalid request data';
          return new Error(`Validation error: ${details}`);
        case 429:
          const retryAfter = error.response.headers?.['retry-after'];
          const retryMsg = retryAfter
            ? ` retry after ${retryAfter} seconds`
            : '';
          return new Error(`Rate-limited,${retryMsg}`);
        default:
          return new Error(data?.message || `HTTP ${status} error`);
      }
    }
    return new Error('Network error occurred');
  }

  async createChatbot(payload: CreateChatbotDto): Promise<Chatbot> {
    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `${this.baseURL}/api/v2/create-chatbot`,
        headers: this.getHeaders(),
        body: payload,
        timeout: 30000,
        retries: 3,
      });
      return Chatbot.parse(response.body);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async deleteChatbot(chatbotId: string): Promise<{ status: string }> {
    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.DELETE,
        url: `${this.baseURL}/api/v2/delete-chatbot/${chatbotId}`,
        headers: this.getHeaders(),
        timeout: 30000,
        retries: 3,
      });
      return response.body;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async sendMessage(payload: SendMessageDto): Promise<Message> {
    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `${this.baseURL}/api/v2/chat`,
        headers: this.getHeaders(),
        body: payload,
        timeout: 30000,
        retries: 3,
      });
      if (payload.stream) {
        return {
          response: response.body,
          conversationId: payload.conversationId,
        };
      }
      return Message.parse(response.body);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateChatbotSettings(
    payload: UpdateChatbotSettingsDto
  ): Promise<{ status: string }> {
    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `${this.baseURL}/api/v2/update-chatbot-settings`,
        headers: this.getHeaders(),
        body: payload,
        timeout: 30000,
        retries: 3,
      });
      return response.body;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async retrainChatbot(payload: RetrainOptions): Promise<RetrainJob> {
    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `${this.baseURL}/api/v2/retrain-chatbot`,
        headers: this.getHeaders(),
        body: payload,
        timeout: 30000,
        retries: 3,
      });
      return RetrainJob.parse(response.body);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getRetrainJobStatus(jobId: string): Promise<RetrainJobStatus> {
    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${this.baseURL}/retrain-jobs/${jobId}`,
        headers: this.getHeaders(),
        timeout: 30000,
        retries: 3,
      });
      return RetrainJobStatus.parse(response.body);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async uploadFile(
    chatbotId: string,
    file: string | Buffer,
    meta: { filename: string; contentType: string }
  ): Promise<FileMeta> {
    try {
      const formData = new FormData();

      if (typeof file === 'string') {
        if (file.startsWith('data:') || file.match(/^[A-Za-z0-9+/]+=*$/)) {
          const buffer = Buffer.from(
            file.replace(/^data:[^;]+;base64,/, ''),
            'base64'
          );
          formData.append('file', buffer, {
            filename: meta.filename,
            contentType: meta.contentType,
          });
        } else {
          const fileStream = fs.createReadStream(file);
          formData.append('file', fileStream, {
            filename: meta.filename,
            contentType: meta.contentType,
          });
        }
      } else {
        formData.append('file', file, {
          filename: meta.filename,
          contentType: meta.contentType,
        });
      }

      const headers = {
        Authorization: `Bearer ${this.apiKey}`,
        ...formData.getHeaders(),
      };

      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `${this.baseURL}/api/v2/upload-file/${chatbotId}`,
        headers,
        body: formData,
        timeout: 30000,
        retries: 3,
      });

      return FileMeta.parse(response.body);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async subscribeWebhook(
    chatbotId: string,
    callbackUrl: string
  ): Promise<WebhookSubscription> {
    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `${this.baseURL}/chatbots/${chatbotId}/webhooks`,
        headers: this.getHeaders(),
        body: {
          callbackUrl,
          events: ['new_message', 'new_lead', 'escalation'],
        },
        timeout: 30000,
        retries: 3,
      });
      return WebhookSubscription.parse(response.body);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async listEvents(
    chatbotId: string,
    since?: string,
    page = 1
  ): Promise<EventList> {
    try {
      const queryParams: Record<string, string> = { page: page.toString() };
      if (since) queryParams['since'] = since;

      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${this.baseURL}/chatbots/${chatbotId}/events`,
        headers: this.getHeaders(),
        queryParams,
        timeout: 30000,
        retries: 3,
      });
      return EventList.parse(response.body);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async listChatbots(): Promise<Array<{ id: string; name: string }>> {
    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${this.baseURL}/api/v2/chatbots`,
        headers: this.getHeaders(),
        timeout: 30000,
        retries: 3,
      });
      return response.body.chatbots || [];
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async listConversations(
    chatbotId: string
  ): Promise<Array<{ id: string; title: string; lastMessage?: string }>> {
    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${this.baseURL}/api/v2/conversations/${chatbotId}`,
        headers: this.getHeaders(),
        timeout: 30000,
        retries: 3,
      });
      return response.body.conversations || [];
    } catch (error) {
      throw this.handleError(error);
    }
  }
}
