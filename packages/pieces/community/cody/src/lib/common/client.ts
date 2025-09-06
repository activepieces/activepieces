import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export interface CodyApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: CodyPaginationMeta;
}

export interface CodyPaginationMeta {
  pagination: {
    count: number;
    total: number;
    per_page: number;
    total_pages: number;
    next_page?: number;
    previous_page?: number;
  };
}

export interface CodyBot {
  id: string;
  name: string;
  created_at: number;
}

export interface CodyConversation {
  id: string;
  name: string;
  bot_id: string;
  created_at: number;
}

export interface CodyMessageSource {
  type: string;
  created_at: number;
  document_id: string;
  document_url: string;
  document_name: string;
}

export interface CodyMessage {
  id: string;
  content: string;
  conversation_id: string;
  machine: boolean;
  failed_responding: boolean;
  flagged: boolean;
  created_at: number;
  sources?: {
    data: CodyMessageSource | CodyMessageSource[];
  };
}

export interface CodyDocument {
  id: string;
  name: string;
  status: string;
  content_url: string;
  folder_id?: string;
  created_at: number;
  file_type?: string;
}

export interface CodyUploadUrl {
  url: string;
  key: string;
}

export class CodyClient {
  private readonly baseUrl = 'https://getcody.ai/api/v1';

  constructor(private readonly apiKey: string) {}

  private async makeRequest<T>(
    endpoint: string,
    method: HttpMethod = HttpMethod.GET,
    body?: any
  ): Promise<CodyApiResponse<T>> {
    try {
      const response = await httpClient.sendRequest({
        method,
        url: `${this.baseUrl}${endpoint}`,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      if (response.status >= 200 && response.status < 300) {
        return {
          success: true,
          data: response.body,
        };
      } else {
        return {
          success: false,
          error: response.body?.message || `HTTP ${response.status}`,
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async getBots(keyword?: string): Promise<CodyApiResponse<CodyBot[]>> {
    const endpoint = keyword ? `/bots?keyword=${encodeURIComponent(keyword)}` : '/bots';
    return this.makeRequest<CodyBot[]>(endpoint);
  }

  async findBotByName(name: string): Promise<CodyApiResponse<CodyBot | null>> {
    const response = await this.getBots(name);
    if (!response.success || !response.data) {
      return {
        success: false,
        error: response.error || 'Failed to retrieve bots',
        data: null,
      };
    }

    const bot = response.data.find(bot => 
      bot.name.toLowerCase().includes(name.toLowerCase())
    );

    return {
      success: true,
      data: bot || null,
    };
  }

  async getConversations(botId?: string, keyword?: string, includes?: string): Promise<CodyApiResponse<CodyConversation[]>> {
    const params = new URLSearchParams();
    
    if (botId) {
      params.append('bot_id', botId);
    }
    if (keyword) {
      params.append('keyword', keyword);
    }
    if (includes) {
      params.append('includes', includes);
    }
    
    const endpoint = params.toString() ? `/conversations?${params.toString()}` : '/conversations';
    return this.makeRequest<CodyConversation[]>(endpoint);
  }

  async createConversation(
    botId: string, 
    name: string, 
    documentIds?: string[]
  ): Promise<CodyApiResponse<CodyConversation>> {
    const requestBody: any = {
      name,
      bot_id: botId,
    };
    
    if (documentIds && documentIds.length > 0) {
      requestBody.document_ids = documentIds;
    }
    
    return this.makeRequest<CodyConversation>('/conversations', HttpMethod.POST, requestBody);
  }

  async findConversationByName(name: string, botId?: string): Promise<CodyApiResponse<CodyConversation | null>> {
    const response = await this.getConversations(botId, name);
    if (!response.success || !response.data) {
      return {
        success: false,
        error: response.error || 'Failed to retrieve conversations',
        data: null,
      };
    }

    const conversation = response.data.length > 0 ? response.data[0] : null;
    if (!conversation) {
      const fallbackResponse = await this.getConversations(botId);
      if (fallbackResponse.success && fallbackResponse.data) {
        const foundConv = fallbackResponse.data.find(conv => 
          conv.name?.toLowerCase().includes(name.toLowerCase())
        );
        return {
          success: true,
          data: foundConv || null,
        };
      }
    }
    
    return {
      success: true,
      data: conversation || null,
    };
  }

  async sendMessage(conversationId: string, content: string): Promise<CodyApiResponse<CodyMessage>> {
    return this.makeRequest<CodyMessage>('/messages', HttpMethod.POST, {
      content,
      conversation_id: conversationId,
    });
  }

  async getMessages(conversationId: string, includes?: string): Promise<CodyApiResponse<CodyMessage[]>> {
    const params = new URLSearchParams();
    params.append('conversation_id', conversationId);
    
    if (includes) {
      params.append('includes', includes);
    }
    
    const endpoint = `/messages?${params.toString()}`;
    return this.makeRequest<CodyMessage[]>(endpoint);
  }

  async createDocumentFromText(
    name: string,
    content: string,
    folderId?: string
  ): Promise<CodyApiResponse<CodyDocument>> {
    const requestBody: any = {
      name,
      content,
    };
    
    if (folderId) {
      requestBody.folder_id = folderId;
    }
    
    return this.makeRequest<CodyDocument>('/documents', HttpMethod.POST, requestBody);
  }

  async getUploadUrl(fileName: string, contentType: string): Promise<CodyApiResponse<CodyUploadUrl>> {
    return this.makeRequest<CodyUploadUrl>('/uploads/signed-url', HttpMethod.POST, {
      file_name: fileName,
      content_type: contentType,
    });
  }

  async uploadFile(uploadUrl: string, fileData: Buffer, contentType: string): Promise<CodyApiResponse<any>> {
    try {
      const response = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': contentType,
        },
        body: fileData,
      });

      if (response.ok) {
        return {
          success: true,
          data: { uploaded: true },
        };
      } else {
        return {
          success: false,
          error: `Upload failed: ${response.status} ${response.statusText}`,
          data: null,
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload error',
        data: null,
      };
    }
  }

  async createDocumentFromFile(name: string, fileKey: string, folderId?: string): Promise<CodyApiResponse<CodyDocument>> {
    const requestBody: any = {
      name: name,
      key: fileKey,
    };
    
    if (folderId) {
      requestBody.folder_id = folderId;
    }
    
    return this.makeRequest<CodyDocument>('/documents/file', HttpMethod.POST, requestBody);
  }
}
