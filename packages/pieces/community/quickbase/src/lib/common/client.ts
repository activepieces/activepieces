import { QuickbaseApiError } from './types';

export class QuickbaseClient {
  private readonly baseUrl = 'https://api.quickbase.com/v1';
  private readonly userToken: string;

  constructor(userToken: string) {
    this.userToken = userToken;
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'QB-USER-TOKEN': this.userToken,
      'Content-Type': 'application/json',
      ...options.headers,
    };

    let lastError: Error;
    
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const response = await fetch(url, {
          ...options,
          headers,
        });

        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          const delay = retryAfter ? parseInt(retryAfter) * 1000 : Math.pow(2, attempt) * 1000;
          await this.sleep(delay);
          continue;
        }

        if (response.status >= 500) {
          if (attempt === 3) {
            throw new Error(`Server error: ${response.status} ${response.statusText}`);
          }
          await this.sleep(Math.pow(2, attempt) * 1000);
          continue;
        }

        if (!response.ok) {
          const errorBody = await response.text();
          let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
          
          try {
            const errorData: QuickbaseApiError = JSON.parse(errorBody);
            if (errorData.errors && errorData.errors.length > 0) {
              errorMessage = errorData.errors[0].message;
              if (errorData.errors[0].description) {
                errorMessage += ` - ${errorData.errors[0].description}`;
              }
            }
          } catch {
            errorMessage = errorBody || errorMessage;
          }

          throw new Error(errorMessage);
        }

        const responseText = await response.text();
        if (!responseText) {
          return {} as T;
        }

        return JSON.parse(responseText) as T;
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
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return true;
    }
    return false;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.makeRequest<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.makeRequest<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data: any): Promise<T> {
    return this.makeRequest<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string, data?: any): Promise<T> {
    return this.makeRequest<T>(endpoint, {
      method: 'DELETE',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
}