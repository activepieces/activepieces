import { httpClient, HttpMethod, HttpRequest } from '@activepieces/pieces-common';
import {
  GoogleSearchConfig,
  RequestOptions,
  SerpApiConfig,
  SerpApiEngine,
  SerpApiResponse,
} from '../types';
import { SerpApiValidator } from '../utils/validators';


// Configuration for the SerpApi client
export interface SerpApiClientConfig {
  /** Base URL for SerpApi */
  baseUrl?: string;
  /** Default timeout for requests */
  defaultTimeout?: number;
  /** Default number of retries */
  defaultRetries?: number;
  /** Default delay between retries (ms) */
  defaultRetryDelay?: number;
  /** Enable request/response logging */
  enableLogging?: boolean;
}

// Creates an appropriate error based on the HTTP status code and response
function createErrorFromResponse(statusCode: number, response: any, message?: string): Error {
  const defaultMessage = message || 'API request failed';
  const responseMessage = response?.error || response?.message;
  const finalMessage = responseMessage || defaultMessage;

  const error = new Error(finalMessage);
  (error as any).statusCode = statusCode;
  (error as any).response = response;

  switch (statusCode) {
    case 401:
      (error as any).code = 'SERP_API_AUTH_ERROR';
      break;
    case 400:
      (error as any).code = 'SERP_API_VALIDATION_ERROR';
      break;
    case 402:
      (error as any).code = 'SERP_API_QUOTA_EXCEEDED_ERROR';
      break;
    case 408:
      (error as any).code = 'SERP_API_TIMEOUT_ERROR';
      break;
    case 429:
      (error as any).code = 'SERP_API_RATE_LIMIT_ERROR';
      (error as any).retryAfter = response?.retry_after || response?.retryAfter;
      break;
    default:
      (error as any).code = 'SERP_API_RESPONSE_ERROR';
      break;
  }

  return error;
}

// Creates a network error from a connection/network issue
function createNetworkError(originalError: Error): Error {
  const error = new Error(`Network error: ${originalError.message}`);
  (error as any).code = 'SERP_API_NETWORK_ERROR';
  (error as any).originalError = originalError.message;
  return error;
}

// Creates a timeout error
function createTimeoutError(timeout: number): Error {
  const error = new Error(`Request timed out after ${timeout}ms`);
  (error as any).code = 'SERP_API_TIMEOUT_ERROR';
  (error as any).statusCode = 408;
  (error as any).timeout = timeout;
  return error;
}

// SerpApi client
export class SerpApiClient {
  private readonly baseUrl: string;
  private readonly defaultTimeout: number;
  private readonly defaultRetries: number;
  private readonly defaultRetryDelay: number;
  private readonly enableLogging: boolean;

  // Creates a new SerpApi client instance
  constructor(config: SerpApiClientConfig = {}) {
    this.baseUrl = config.baseUrl || 'https://serpapi.com/search';
    this.defaultTimeout = config.defaultTimeout || 30000;
    this.defaultRetries = config.defaultRetries || 3;
    this.defaultRetryDelay = config.defaultRetryDelay || 1000;
    this.enableLogging = config.enableLogging || false;
  }

  // Executes a search request with comprehensive error handling and retry logic
  async executeSearch<T = any>(
    config: SerpApiConfig,
    options: RequestOptions = {}
  ): Promise<SerpApiResponse<T>> {
    // Validate and sanitize input
    const validatedConfig = SerpApiValidator.validateAndSanitize(config);

    // Apply request options with defaults
    const requestOptions: Required<RequestOptions> = {
      timeout: options.timeout || this.defaultTimeout,
      retries: options.retries || this.defaultRetries,
      retryDelay: options.retryDelay || this.defaultRetryDelay,
    };

    return this.executeWithRetry<T>(validatedConfig, requestOptions);
  }

  // Validates API key by making a test request
  async validateApiKey(apiKey: string): Promise<boolean> {
    try {
      const testConfig: GoogleSearchConfig = {
        api_key: apiKey,
        engine: SerpApiEngine.GOOGLE,
        q: 'test',
        num: 1,
      };

      await this.makeHttpRequest<any>(testConfig, { timeout: 10000, retries: 1, retryDelay: 0 });
      return true;
    } catch (error: any) {
      if (error.code === 'SERP_API_AUTH_ERROR') {
        return false;
      }
      // Other errors might indicate network issues, not invalid API key
      throw error;
    }
  }

  // Executes request with retry logic
  private async executeWithRetry<T>(
    config: SerpApiConfig,
    options: Required<RequestOptions>
  ): Promise<SerpApiResponse<T>> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= options.retries + 1; attempt++) {
      try {
        const response = await this.makeHttpRequest<T>(config, options);

        if (this.enableLogging) {
          console.log(`SerpApi request successful on attempt ${attempt}:`, {
            engine: config.engine,
            query: config.q,
            responseTime: response.search_metadata?.total_time_taken,
          });
        }

        return response;
      } catch (error) {
        lastError = error as Error;

        // Don't retry on certain error types
        if (this.shouldNotRetry(error as Error)) {
          throw error;
        }

        // Don't retry on last attempt
        if (attempt <= options.retries) {
          const delay = this.calculateRetryDelay(attempt, options.retryDelay);

          if (this.enableLogging) {
            console.warn(`SerpApi request failed on attempt ${attempt}, retrying in ${delay}ms:`, {
              error: (error as Error).message,
              attempt,
              maxRetries: options.retries,
            });
          }

          await this.sleep(delay);
        }
      }
    }

    const error = new Error('Request failed after all retry attempts');
    (error as any).code = 'SERP_API_RESPONSE_ERROR';
    (error as any).statusCode = 500;
    (error as any).attempts = options.retries + 1;
    throw lastError || error;
  }

  // Makes the actual HTTP request to SerpApi
  private async makeHttpRequest<T>(
    config: SerpApiConfig,
    options: Required<RequestOptions>
  ): Promise<SerpApiResponse<T>> {
    try {
      // Build query parameters, filtering out undefined values
      const queryParams = this.buildQueryParams(config);

      const httpRequest: HttpRequest = {
        method: HttpMethod.GET,
        url: this.baseUrl,
        queryParams,
        timeout: options.timeout,
      };

      if (this.enableLogging) {
        console.log('Making SerpApi request:', {
          url: this.baseUrl,
          params: this.sanitizeParamsForLogging(queryParams),
        });
      }

      const response = await httpClient.sendRequest(httpRequest);

      // Handle API-level errors in successful HTTP responses
      if (response.body?.error) {
        throw createErrorFromResponse(
          response.status || 400,
          response.body,
          response.body.error
        );
      }

      return this.transformResponse<T>(response.body);
    } catch (error) {
      throw this.handleHttpError(error as Error);
    }
  }

  // Builds query parameters from config, filtering undefined values
  private buildQueryParams(config: SerpApiConfig): Record<string, string> {
    const params: Record<string, any> = { ...config };

    // Remove undefined values and convert all to strings
    const cleanParams: Record<string, string> = {};
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        cleanParams[key] = String(value);
      }
    }

    return cleanParams;
  }

  // Transforms raw API response into structured format
  private transformResponse<T>(rawResponse: any): SerpApiResponse<T> {
    return {
      data: rawResponse as T,
    };
  }

  // Handles and transforms HTTP errors into SerpApi errors
  private handleHttpError(error: Error): Error {
    // Handle timeout errors
    if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
      return createTimeoutError(this.defaultTimeout);
    }

    // Handle network errors
    if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
      return createNetworkError(error);
    }

    // Handle HTTP response errors
    if ((error as any).status) {
      return createErrorFromResponse(
        (error as any).status,
        (error as any).body,
        error.message
      );
    }

    // Default to network error for unknown errors
    return createNetworkError(error);
  }

  // Determines if an error should not be retried
  private shouldNotRetry(error: Error): boolean {
    const errorCode = (error as any).code;

    // Don't retry authentication errors
    if (errorCode === 'SERP_API_AUTH_ERROR') {
      return true;
    }

    // Don't retry validation errors
    if (errorCode === 'SERP_API_VALIDATION_ERROR') {
      return true;
    }

    // Don't retry quota exceeded errors
    if (errorCode === 'SERP_API_QUOTA_EXCEEDED_ERROR') {
      return true;
    }

    return false;
  }

  // Calculates retry delay with exponential backoff
  private calculateRetryDelay(attempt: number, baseDelay: number): number {
    // Exponential backoff: baseDelay * 2^(attempt-1)
    return baseDelay * Math.pow(2, attempt - 1);
  }

  // Sleep utility for retry delays
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Sanitizes parameters for logging (removes sensitive data)
  private sanitizeParamsForLogging(params: Record<string, string>): Record<string, string> {
    const sanitized = { ...params };
    if (sanitized['api_key']) {
      sanitized['api_key'] = '***REDACTED***';
    }
    return sanitized;
  }

  // Returns client configuration information
  getClientInfo(): SerpApiClientConfig {
    return {
      baseUrl: this.baseUrl,
      defaultTimeout: this.defaultTimeout,
      defaultRetries: this.defaultRetries,
      defaultRetryDelay: this.defaultRetryDelay,
      enableLogging: this.enableLogging,
    };
  }
}
