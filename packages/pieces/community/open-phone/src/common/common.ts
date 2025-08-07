import { HttpRequest, HttpMethod, httpClient } from '@activepieces/pieces-framework';

export interface OpenPhoneAuthConfig {
  apiKey: string;
  baseUrl: string;
}

export class OpenPhoneAPI {
  constructor(private auth: OpenPhoneAuthConfig) {}

  async makeRequest<T>(
    method: HttpMethod,
    url: string,
    body?: any,
    queryParams?: Record<string, any>
  ): Promise<T> {
    const request: HttpRequest = {
      method,
      url: `${this.auth.baseUrl}${url}`,
      headers: {
        'Authorization': `Bearer ${this.auth.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
      queryParams,
    };

    const response = await httpClient.sendRequest(request);
    
    if (response.status >= 400) {
      throw new Error(`OpenPhone API Error: ${response.status} - ${JSON.stringify(response.body)}`);
    }
    
    return response.body as T;
  }
}

export interface Contact {
  id: string;
  name: string;
  phoneNumbers: Array<{
    phoneNumber: string;
    type: 'mobile' | 'home' | 'work' | 'other';
  }>;
  emails?: Array<{
    email: string;
    type: 'home' | 'work' | 'other';
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface Call {
  id: string;
  direction: 'inbound' | 'outbound';
  phoneNumberId: string;
  from: string;
  to: string;
  status: 'completed' | 'no-answer' | 'busy' | 'failed';
  duration?: number;
  recordingUrl?: string;
  transcriptionId?: string;
  voicemailUrl?: string;
  createdAt: string;
  completedAt?: string;
}

export interface Message {
  id: string;
  direction: 'inbound' | 'outbound';
  phoneNumberId: string;
  from: string;
  to: string;
  body: string;
  mediaUrls?: string[];
  status: 'sent' | 'delivered' | 'failed';
  createdAt: string;
}
