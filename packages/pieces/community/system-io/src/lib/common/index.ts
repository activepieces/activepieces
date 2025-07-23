import { PieceAuth } from '@activepieces/pieces-framework';
import { 
  HttpRequest, 
  HttpMethod, 
  httpClient,
  HttpError
} from '@activepieces/pieces-common';

export interface SystemeContact {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  locale?: string;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  customFields?: Record<string, unknown>;
}

export interface SystemeContactsResponse {
  items: SystemeContact[];
  total?: number;
  page?: number;
  limit?: number;
}

export interface SystemeTag {
  id: string;
  name: string;
}

export interface SystemeApiError {
  message: string;
  errors?: Record<string, string[]>;
  code?: string;
}

export interface SystemeApiResponse<T = unknown> {
  data?: T;
  message?: string;
  success?: boolean;
}

export const systemeAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: 'API key from your Systeme.io account (found in Profile Settings -> Public API keys)',
});

export const systemeCommon = {
  baseUrl: 'https://api.systeme.io/api' as const,
  
  async makeRequest<T = unknown>(
    auth: string,
    method: HttpMethod,
    endpoint: string,
    body?: Record<string, unknown> | unknown[],
    queryParams?: Record<string, string>
  ): Promise<T> {
    this.validateAuth(auth);
    this.validateEndpoint(endpoint);

    const request: HttpRequest = {
      method,
      url: `${this.baseUrl}${endpoint}`,
      headers: {
        'X-API-Key': auth.trim(),
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Activepieces-Systeme.io/1.0.0',
      },
      body,
      queryParams: queryParams || {},
    };

    try {
      const response = await httpClient.sendRequest<T>(request);
      return response.body;
    } catch (error) {
      const errorMessage = this.parseApiError(error);
      throw new Error(errorMessage);
    }
  },

  async makeRequestWithAuth<T = unknown>(
    auth: string,
    method: HttpMethod,
    endpoint: string,
    body?: Record<string, unknown> | unknown[]
  ): Promise<T> {
    return this.makeRequest<T>(auth, method, endpoint, body);
  },

  validateAuth(auth: string): void {
    if (!auth?.trim()) {
      throw new Error('API key is required and cannot be empty');
    }
    
    if (auth.trim().length < 10) {
      throw new Error('API key appears to be invalid (too short)');
    }
  },

  validateEndpoint(endpoint: string): void {
    if (!endpoint?.trim()) {
      throw new Error('API endpoint is required and cannot be empty');
    }
    
    if (!endpoint.startsWith('/')) {
      throw new Error('API endpoint must start with "/"');
    }
  },

  parseApiError(error: unknown): string {
    if (error instanceof HttpError) {
      const status = error.response.status;
      const data = error.response.body as SystemeApiError | string;
      
      let message = '';
      if (typeof data === 'object' && data?.message) {
        message = data.message;
      } else if (typeof data === 'string') {
        message = data;
      }
      
      switch (status) {
        case 400:
          return `Bad request: ${message || 'Invalid request data. Please check your input parameters.'}`;
        case 401:
          return 'Authentication failed: Invalid API key. Please check your API key in Systeme.io account settings.';
        case 403:
          return 'Access forbidden: Your API key does not have permission for this operation.';
        case 404:
          return `Resource not found: ${message || 'The requested resource does not exist or has been deleted.'}`;
        case 409:
          return `Conflict: ${message || 'Resource already exists or operation conflicts with current state.'}`;
        case 422:
          return `Validation error: ${message || 'The provided data is invalid. Please check all required fields.'}`;
        case 429:
          return 'Rate limit exceeded: Too many requests. Please wait a moment before trying again.';
        case 500:
          return 'Internal server error: Systeme.io API is experiencing issues. Please try again later.';
        case 502:
          return 'Bad gateway: Systeme.io API is temporarily unavailable.';
        case 503:
          return 'Service unavailable: Systeme.io API is under maintenance.';
        case 504:
          return 'Gateway timeout: Request to Systeme.io API timed out.';
        default:
          return `API error (${status}): ${message || 'An unexpected error occurred.'}`;
      }
    }
    
    if (error && typeof error === 'object') {
      const err = error as Record<string, unknown>;
      
      if (err['code'] === 'ENOTFOUND' || err['code'] === 'ECONNREFUSED') {
        return 'Network error: Unable to connect to Systeme.io API. Please check your internet connection.';
      }
      
      if (err['code'] === 'ETIMEDOUT') {
        return 'Timeout error: Request to Systeme.io API timed out. Please try again.';
      }
      
      if (err['code'] === 'ECONNRESET') {
        return 'Connection reset: The connection to Systeme.io API was reset. Please try again.';
      }
    }
    
    if (error instanceof Error) {
      return error.message;
    }
    
    return 'Unknown error occurred while communicating with Systeme.io API';
  },

  validateEmail(email: string): boolean {
    if (!email || typeof email !== 'string') {
      return false;
    }
    
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    if (email.length > 254) {
      return false;
    }
    
    const parts = email.split('@');
    if (parts.length !== 2) {
      return false;
    }
    
    const [localPart, domainPart] = parts;
    if (localPart.length > 64 || domainPart.length > 253) {
      return false;
    }
    
    return emailRegex.test(email);
  },

  validateId(id: string): boolean {
    if (!id || typeof id !== 'string') {
      return false;
    }
    
    const trimmedId = id.trim();
    return trimmedId.length > 0 && trimmedId.length <= 255;
  },

  validatePhoneNumber(phone: string): boolean {
    if (!phone || typeof phone !== 'string') {
      return false;
    }
    
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    
    return phoneRegex.test(cleanPhone) && cleanPhone.length >= 7 && cleanPhone.length <= 15;
  },

  validateLocale(locale: string): boolean {
    if (!locale || typeof locale !== 'string') {
      return false;
    }
    
    const localeRegex = /^[a-z]{2}(-[A-Z]{2})?$/;
    return localeRegex.test(locale);
  },

  sanitizeString(input: string | undefined | null): string | undefined {
    if (!input || typeof input !== 'string') {
      return undefined;
    }
    
    return input.trim() || undefined;
  },

  validateCustomFields(customFields: Record<string, unknown>): boolean {
    if (!customFields || typeof customFields !== 'object') {
      return false;
    }
    
    return Object.entries(customFields).every(([key, value]) => {
      return typeof key === 'string' && 
             key.length > 0 && 
             key.length <= 100 &&
             typeof value !== 'function' &&
             typeof value !== 'symbol' &&
                          value !== undefined;
     });
   },
}; 