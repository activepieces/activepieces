import {
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';
import { QuickbaseApiError } from './types';

export class QuickbaseClient {
  private readonly baseUrl = 'https://api.quickbase.com/v1';
  private readonly userToken: string;
  private readonly realmHostname: string;

  constructor(realmHostname: string, userToken: string) {
    this.realmHostname = realmHostname;
    this.userToken = userToken;
  }

  private async makeRequest<T>(
    endpoint: string,
    method: HttpMethod,
    data?: any
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const request: HttpRequest = {
      method,
      url,
      headers: {
        'QB-Realm-Hostname': this.realmHostname,
        'Authorization': `QB-USER-TOKEN ${this.userToken}`,
        'Content-Type': 'application/json',
      },
      body: data ? data : undefined,
    };

    let lastError: Error;

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const response = await httpClient.sendRequest<T>(request);

        if (response.status === 429) {
          const retryAfter = response.headers?.['retry-after'];
          const retryAfterValue = Array.isArray(retryAfter)
            ? retryAfter[0]
            : retryAfter;
          const delay = retryAfterValue
            ? parseInt(retryAfterValue) * 1000
            : Math.pow(2, attempt) * 1000;
          await this.sleep(delay);
          continue;
        }

        if (response.status >= 500) {
          if (attempt === 3) {
            throw new Error(`Server error: ${response.status}`);
          }
          await this.sleep(Math.pow(2, attempt) * 1000);
          continue;
        }

        if (response.status >= 400) {
          let errorMessage = `HTTP ${response.status}`;

          try {
            const errorData = response.body as QuickbaseApiError;
            if (errorData.errors && errorData.errors.length > 0) {
              errorMessage = errorData.errors[0].message;
              if (errorData.errors[0].description) {
                errorMessage += ` - ${errorData.errors[0].description}`;
              }
            }
          } catch {
            errorMessage = response.body ? String(response.body) : errorMessage;
          }

          throw new Error(errorMessage);
        }

        return response.body;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt === 3 || !this.isRetryableError(error)) {
          throw lastError;
        }

        await this.sleep(Math.pow(2, attempt) * 1000);
      }
    }

    throw lastError!;
  }

  private isRetryableError(error: unknown): boolean {
    if (error instanceof Error && error.message.includes('network')) {
      return true;
    }
    return false;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.makeRequest<T>(endpoint, HttpMethod.GET);
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.makeRequest<T>(endpoint, HttpMethod.POST, data);
  }

  async patch<T>(endpoint: string, data: any): Promise<T> {
    return this.makeRequest<T>(endpoint, HttpMethod.PATCH, data);
  }

  async delete<T>(endpoint: string, data?: any): Promise<T> {
    return this.makeRequest<T>(endpoint, HttpMethod.DELETE, data);
  }
}
