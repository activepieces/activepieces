import { httpClient, HttpMethod, HttpRequest } from '@activepieces/pieces-common';

const BASE_URL = 'https://api.magicalapi.com/v1';

export interface MagicalApiCallParams {
  apiKey: string;
  method: HttpMethod;
  endpoint: string;
  body?: unknown;
  query?: Record<string, string | number | boolean>;
  isFormData?: boolean;
}

export async function magicalApiCall<T = any>({
  apiKey,
  method,
  endpoint,
  body,
  query,
  isFormData = false,
}: MagicalApiCallParams): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${apiKey}`,
  };

  // Don't set Content-Type for FormData, let the browser set it with boundary
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  
  const request: HttpRequest = {
    method,
    url,
    headers,
    body,
    queryParams: query ? Object.fromEntries(
      Object.entries(query).map(([k, v]) => [k, String(v)])
    ) : undefined,
  };

  try {
    const response = await httpClient.sendRequest<T>(request);
    return response.body;
  } catch (error: any) {
    if (error.response?.status === 401) {
      throw new Error('Authentication failed. Please check your API key.');
    }
    
    if (error.response?.status === 429) {
      throw new Error('Rate limit exceeded. Please wait a moment and try again.');
    }
    
    if (error.response?.status >= 400 && error.response?.status < 500) {
      throw new Error(`Request failed: ${error.response?.body?.message || error.message}`);
    }

    throw error;
  }
}
