import { HttpMethod, AuthenticationType, httpClient } from '@activepieces/pieces-common';

export interface CodyResponse<T = unknown> {
  success: boolean;
  data: T;
  error?: string;
}

export async function makeRequest<T = unknown>(
  method: HttpMethod,
  url: string,
  apiKey: string,
  body?: unknown
): Promise<CodyResponse<T>> {
  try {
    const response = await httpClient.sendRequest<CodyResponse<T>>({
      method,
      url: `https://api.meetcody.ai/v1${url}`,
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
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(`Cody API Error: ${error.message}`);
    }
    throw new Error('Cody API Error: Unknown error');
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