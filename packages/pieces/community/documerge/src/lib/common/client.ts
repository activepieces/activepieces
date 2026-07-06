import {
  AuthenticationType,
  httpClient,
  HttpMethod,
  HttpRequest,
  QueryParams,
} from '@activepieces/pieces-common';

const BASE_URL = 'https://app.documerge.ai';

export class DocuMergeClient {
  constructor(private readonly apiKey: string) {}

  async makeRequest<T>(
    method: HttpMethod,
    endpoint: string,
    body?: unknown,
    queryParams?: QueryParams
  ): Promise<T> {
    const url = endpoint.startsWith('/')
      ? `${BASE_URL}${endpoint}`
      : `${BASE_URL}/${endpoint}`;

    const request: HttpRequest = {
      method,
      url,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: this.apiKey,
      },
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body,
      queryParams,
    };

    const response = await httpClient.sendRequest<T>(request);
    return response.body;
  }

  async get<T>(endpoint: string, queryParams?: QueryParams): Promise<T> {
    return this.makeRequest<T>(HttpMethod.GET, endpoint, undefined, queryParams);
  }

  async post<T>(endpoint: string, body?: unknown, queryParams?: QueryParams): Promise<T> {
    return this.makeRequest<T>(HttpMethod.POST, endpoint, body, queryParams);
  }

  async patch<T>(endpoint: string, body?: unknown, queryParams?: QueryParams): Promise<T> {
    return this.makeRequest<T>(HttpMethod.PATCH, endpoint, body, queryParams);
  }

  async put<T>(endpoint: string, body?: unknown, queryParams?: QueryParams): Promise<T> {
    return this.makeRequest<T>(HttpMethod.PUT, endpoint, body, queryParams);
  }

  async delete<T>(endpoint: string, queryParams?: QueryParams): Promise<T> {
    return this.makeRequest<T>(HttpMethod.DELETE, endpoint, undefined, queryParams);
  }

  async makeBinaryRequest(
    method: HttpMethod,
    endpoint: string,
    body?: unknown,
    queryParams?: QueryParams
  ): Promise<ArrayBuffer> {
    const url = endpoint.startsWith('/')
      ? `${BASE_URL}${endpoint}`
      : `${BASE_URL}/${endpoint}`;

    const request: HttpRequest = {
      method,
      url,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: this.apiKey,
      },
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body,
      queryParams,
      responseType: 'arraybuffer',
    };

    const response = await httpClient.sendRequest<ArrayBuffer>(request);
    const responseBody: unknown = response.body;
    
    if (typeof responseBody === 'string') {
      return Buffer.from(responseBody, 'binary').buffer as ArrayBuffer;
    }
    
    if (responseBody instanceof ArrayBuffer) {
      return responseBody;
    }
    
    if (Buffer.isBuffer(responseBody)) {
      const buf = responseBody as Buffer;
      return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
    }
    
    return Buffer.from(responseBody as string).buffer as ArrayBuffer;
  }
}

