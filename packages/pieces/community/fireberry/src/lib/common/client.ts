import { HttpMethod, httpClient, HttpRequest, AuthenticationType } from '@activepieces/pieces-common';

const FIREBERRY_API_BASE_URL = 'https://api.fireberry.com';
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeQueryParams(params?: Record<string, string | number | boolean>): Record<string, string> | undefined {
  if (!params) return undefined;
  const result: Record<string, string> = {};
  for (const key in params) {
    if (Object.prototype.hasOwnProperty.call(params, key)) {
      result[key] = String(params[key]);
    }
  }
  return result;
}

export class FireberryClient {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private parseError(error: any): string {
    if (error?.response?.body) {
      try {
        const body = typeof error.response.body === 'string' ? JSON.parse(error.response.body) : error.response.body;
        if (body?.error) {
          if (typeof body.error === 'string') return body.error;
          if (body.error.message) return body.error.message;
        }
        if (body?.message) return body.message;
      } catch {
        return 'Unknown error';
      }
    }
    if (error?.message) return error.message;
    return 'Unknown error';
  }

  private shouldRetry(status: number): boolean {
    return status === 429 || (status >= 500 && status < 600);
  }

  async request<T = unknown>({
    method,
    resourceUri,
    body,
    queryParams,
  }: {
    method: HttpMethod;
    resourceUri: string;
    body?: unknown;
    queryParams?: Record<string, string | number | boolean>;
  }): Promise<T> {
    const request: HttpRequest = {
      method,
      url: `${FIREBERRY_API_BASE_URL}${resourceUri}`,
      headers: {
        'tokenid': this.apiKey,
        'Content-Type': 'application/json',
      },
      body,
      queryParams: normalizeQueryParams(queryParams),
      timeout: 10000, // 10 seconds
    };
    let lastError: any = null;
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const response = await httpClient.sendRequest<T>(request);
        if (response.status >= 200 && response.status < 300) {
          return response.body;
        } else {
          const errorMsg = this.parseError({ response });
          if (this.shouldRetry(response.status) && attempt < MAX_RETRIES - 1) {
            await delay(RETRY_DELAY_MS * (attempt + 1));
            continue;
          }
          throw new Error(`Fireberry API error (${response.status}): ${errorMsg}`);
        }
      } catch (error: any) {
        const status = error?.response?.status;
        if (status && this.shouldRetry(status) && attempt < MAX_RETRIES - 1) {
          await delay(RETRY_DELAY_MS * (attempt + 1));
          lastError = error;
          continue;
        }
        const errorMsg = this.parseError(error);
        throw new Error(`Fireberry API error${status ? ` (${status})` : ''}: ${errorMsg}`);
      }
    }
    throw new Error(`Fireberry API error: ${this.parseError(lastError)}`);
  }

  async getObjectsMetadata(): Promise<{ success: boolean; data: Array<{ name: string; systemName: string; objectType: string }> }> {
    return this.request<{ success: boolean; data: Array<{ name: string; systemName: string; objectType: string }> }>({
      method: HttpMethod.GET,
      resourceUri: '/metadata/records',
    });
  }

  async getObjectFieldsMetadata(object: string): Promise<{ success: boolean; data: Array<{ label: string; fieldName: string; systemFieldTypeId: string; systemName: string }> }> {
    return this.request<{ success: boolean; data: Array<{ label: string; fieldName: string; systemFieldTypeId: string; systemName: string }> }>({
      method: HttpMethod.GET,
      resourceUri: `/metadata/records/${object}/fields`,
    });
  }

  async getPicklistValues(object: string, fieldName: string): Promise<{ success: boolean; data: { values: Array<{ name: string; value: string }> } }> {
    return this.request<{ success: boolean; data: { values: Array<{ name: string; value: string }> } }>({
      method: HttpMethod.GET,
      resourceUri: `/metadata/records/${object}/fields/${fieldName}/values`,
    });
  }

  async batchCreate(object: string, records: any[]): Promise<any> {
    return this.request({
      method: HttpMethod.POST,
      resourceUri: `/api/v3/record/${object}/batch/create`,
      body: { data: records },
    });
  }

  async batchUpdate(object: string, records: any[]): Promise<any> {
    return this.request({
      method: HttpMethod.POST,
      resourceUri: `/api/v3/record/${object}/batch/update`,
      body: { data: records },
    });
  }

  async batchDelete(object: string, ids: string[]): Promise<any> {
    return this.request({
      method: HttpMethod.POST,
      resourceUri: `/api/v3/record/${object}/batch/delete`,
      body: { data: ids },
    });
  }
} 