import { httpClient, HttpMethod, HttpMessageBody } from '@activepieces/pieces-common';
import { AppConnectionValueForAuthProperty } from '@activepieces/pieces-framework';
import { fragmentAuth } from './auth';

export const BASE_URL = 'https://api.onfragment.com/api/v1';

export interface FragmentTask {
  uid?: string;
  title: string;
  url?: string;
  due_at?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  status?: 'open' | 'completed' | 'cancelled';
  assignee?: string;
  tags?: string[];
  custom_fields?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

export const fragmentClient = {
  async makeRequest<T extends HttpMessageBody = any>(
    method: HttpMethod,
    path: string,
    apiKey: AppConnectionValueForAuthProperty<typeof fragmentAuth>,
    body?: any,
    queryParams?: Record<string, string>
  ): Promise<T> {
    const url = `${BASE_URL}${path}`;
    
    try {
      const response = await httpClient.sendRequest<T>({
        method,
        url,
        headers: {
          'Authorization': `Bearer ${apiKey.secret_text}`,
          'Content-Type': 'application/json',
        },
        body,
        queryParams,
      });
      
      return response.body;
    } catch (error: any) {
      const errorMessage = error.response?.body?.message || error.message || 'Unknown error occurred';
      throw new Error(`Fragment API Error: ${errorMessage}`);
    }
  },
};

