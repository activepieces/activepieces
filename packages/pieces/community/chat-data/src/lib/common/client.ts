import axios, { AxiosInstance, AxiosError } from 'axios';
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
  private client: AxiosInstance;
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env['CHATDATA_API_KEY'] || '';
    if (!this.apiKey) {
      throw new Error('CHATDATA_API_KEY environment variable is required');
    }

    const baseURL =
      process.env['CHATDATA_BASE_URL'] || 'https://api.chat-data.com/v1';

    this.client = axios.create({
      baseURL,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (
          this.shouldRetry(error) &&
          error.config &&
          !(error.config as any).retryCount
        ) {
          return this.retryRequest(error);
        }
        throw this.mapError(error);
      }
    );
  }

  private shouldRetry(error: AxiosError): boolean {
    if (!error.response) return true;
    const status = error.response.status;
    return status >= 500 || status === 429;
  }

  private async retryRequest(error: AxiosError, attempt = 1): Promise<any> {
    const maxAttempts = 3;
    if (attempt >= maxAttempts) {
      throw this.mapError(error);
    }

    let delay = Math.pow(2, attempt) * 1000;

    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'];
      if (retryAfter) {
        delay = parseInt(retryAfter) * 1000;
      }
    }

    await new Promise((resolve) => setTimeout(resolve, delay));

    try {
      if (error.config) {
        (error.config as any).retryCount = attempt;
        return await this.client.request(error.config);
      }
    } catch (retryError) {
      if (retryError instanceof AxiosError && this.shouldRetry(retryError)) {
        return this.retryRequest(retryError, attempt + 1);
      }
      throw this.mapError(retryError as AxiosError);
    }
  }

  private mapError(error: AxiosError): Error {
    if (!error.response) {
      return new Error('Network error occurred');
    }

    const status = error.response.status;
    const data = error.response.data as any;

    switch (status) {
      case 401:
        return new Error('Invalid API key');
      case 403:
        return new Error('Insufficient permissions');
      case 422:
        const details = data?.message || data?.error || 'Invalid request data';
        return new Error(`Validation error: ${details}`);
      case 429:
        const retryAfter = error.response.headers['retry-after'];
        const retryMsg = retryAfter ? ` retry after ${retryAfter} seconds` : '';
        return new Error(`Rate-limited,${retryMsg}`);
      default:
        return new Error(data?.message || `HTTP ${status} error`);
    }
  }

  async createChatbot(payload: CreateChatbotDto): Promise<Chatbot> {
    const response = await this.client.post('/api/v2/create-chatbot', payload);
    return Chatbot.parse(response.data);
  }

  async deleteChatbot(chatbotId: string): Promise<{ status: string }> {
    const response = await this.client.delete(
      `/api/v2/delete-chatbot/${chatbotId}`
    );
    return response.data;
  }

  async sendMessage(payload: SendMessageDto): Promise<Message> {
    const response = await this.client.post('/api/v2/chat', payload);
    if (payload.stream) {
      return {
        response: response.data,
        conversationId: payload.conversationId,
      };
    }
    return Message.parse(response.data);
  }

  async updateChatbotSettings(
    payload: UpdateChatbotSettingsDto
  ): Promise<{ status: string }> {
    const response = await this.client.post(
      '/api/v2/update-chatbot-settings',
      payload
    );
    return response.data;
  }

  async retrainChatbot(payload: RetrainOptions): Promise<RetrainJob> {
    const response = await this.client.post('/api/v2/retrain-chatbot', payload);
    return RetrainJob.parse(response.data);
  }

  async getRetrainJobStatus(jobId: string): Promise<RetrainJobStatus> {
    const response = await this.client.get(`/retrain-jobs/${jobId}`);
    return RetrainJobStatus.parse(response.data);
  }

  async uploadFile(
    chatbotId: string,
    file: string | Buffer,
    meta: { filename: string; contentType: string }
  ): Promise<FileMeta> {
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

    const response = await this.client.post(
      `/api/v2/upload-file/${chatbotId}`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
        },
      }
    );

    return FileMeta.parse(response.data);
  }

  async subscribeWebhook(
    chatbotId: string,
    callbackUrl: string
  ): Promise<WebhookSubscription> {
    const response = await this.client.post(`/chatbots/${chatbotId}/webhooks`, {
      callbackUrl,
      events: ['new_message', 'new_lead', 'escalation'],
    });
    return WebhookSubscription.parse(response.data);
  }

  async listEvents(
    chatbotId: string,
    since?: string,
    page = 1
  ): Promise<EventList> {
    const params: any = { page };
    if (since) params.since = since;

    const response = await this.client.get(`/chatbots/${chatbotId}/events`, {
      params,
    });
    return EventList.parse(response.data);
  }

  async listChatbots(): Promise<Array<{ id: string; name: string }>> {
    const response = await this.client.get('/api/v2/chatbots');
    return response.data.chatbots || [];
  }

  async listConversations(
    chatbotId: string
  ): Promise<Array<{ id: string; title: string; lastMessage?: string }>> {
    const response = await this.client.get(
      `/api/v2/conversations/${chatbotId}`
    );
    return response.data.conversations || [];
  }
}
