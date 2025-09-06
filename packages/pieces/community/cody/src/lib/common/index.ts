import { HttpMethod, AuthenticationType, httpClient } from '@activepieces/pieces-common';

export interface CodyResponse<T = any> {
  success: boolean;
  data: T;
  error?: string;
}

export async function makeRequest<T = any>(
  method: HttpMethod,
  url: string,
  apiKey: string,
  body?: any
): Promise<CodyResponse<T>> {
  try {
    const response = await httpClient.sendRequest<CodyResponse<T>>({
      method,
      url: `https://getcody.ai/api/v1${url}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: apiKey,
      },
      headers: {
        'Content-Type': 'application/json',
      },
      body,
    });

    return response.body;
  } catch (error: any) {
    throw new Error(`Cody API Error: ${error.message}`);
  }
}

export interface Bot {
  id: string;
  name: string;
  description?: string;
  instructions?: string;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  bot_id: string;
  name?: string;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  name: string;
  content: string;
  folder_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  content: string;
  role: 'user' | 'assistant';
  created_at: string;
}

export interface Folder {
  id: string;
  name: string;
  parent_id?: string;
  created_at: string;
  updated_at: string;
}
