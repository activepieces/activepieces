import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export interface MyCaseAuth {
  access_token: string;
  token_type: string;
  refresh_token?: string;
  expires_in?: number;
  firm_uuid?: string;
}

export interface MyCaseApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  details?: any;
}

export class MyCaseApi {
  private baseUrl = 'https://external-integrations.mycase.com/v1';
  
  constructor(private auth: MyCaseAuth) {}

  async makeRequest<T = any>(
    method: HttpMethod,
    endpoint: string,
    body?: any,
    queryParams?: Record<string, string>
  ): Promise<MyCaseApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      
      const response = await httpClient.sendRequest({
        method,
        url,
        headers: {
          'Authorization': `Bearer ${this.auth.access_token}`,
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
        queryParams,
      });

      if (response.status >= 200 && response.status < 300) {
        return {
          success: true,
          data: response.body,
        };
      } else if (response.status === 401) {
        return {
          success: false,
          error: 'Unauthorized - Access token may be expired',
          details: response.body,
        };
      } else {
        return {
          success: false,
          error: `API request failed with status: ${response.status}`,
          details: response.body,
        };
      }
    } catch (error) {
      return {
        success: false,
        error: 'Failed to make API request',
        details: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async get<T = any>(endpoint: string, queryParams?: Record<string, string>): Promise<MyCaseApiResponse<T>> {
    return this.makeRequest<T>(HttpMethod.GET, endpoint, undefined, queryParams);
  }

  async post<T = any>(endpoint: string, body?: any): Promise<MyCaseApiResponse<T>> {
    return this.makeRequest<T>(HttpMethod.POST, endpoint, body);
  }

  async put<T = any>(endpoint: string, body?: any): Promise<MyCaseApiResponse<T>> {
    return this.makeRequest<T>(HttpMethod.PUT, endpoint, body);
  }

  async delete<T = any>(endpoint: string): Promise<MyCaseApiResponse<T>> {
    return this.makeRequest<T>(HttpMethod.DELETE, endpoint);
  }
}

export function createMyCaseApi(auth: any): MyCaseApi {
  return new MyCaseApi(auth as MyCaseAuth);
}