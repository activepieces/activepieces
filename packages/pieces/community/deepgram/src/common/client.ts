import {
  httpClient,
  HttpMethod,
  QueryParams,
  HttpHeaders,
} from '@activepieces/pieces-common';

export interface DeepgramClientOptions {
  body?: any;
  queryParams?: QueryParams;
  headers?: HttpHeaders;
  responseType?: 'json' | 'arraybuffer';
}

export class DeepgramClient {
  private readonly baseUrl = 'https://api.deepgram.com/v1';

  constructor(private apiKey: string) {}

  async get(endpoint: string, options: DeepgramClientOptions = {}) {
    return this.makeRequest(HttpMethod.GET, endpoint, options);
  }

  async post(endpoint: string, options: DeepgramClientOptions = {}) {
    return this.makeRequest(HttpMethod.POST, endpoint, options);
  }

  private async makeRequest(
    method: HttpMethod,
    endpoint: string,
    options: DeepgramClientOptions = {}
  ) {
    const { body, queryParams, headers = {}, responseType = 'json' } = options;

    const response = await httpClient.sendRequest({
      method,
      url: `${this.baseUrl}${endpoint}`,
      headers: {
        Authorization: `Token ${this.apiKey}`,
        ...headers,
      },
      body,
      queryParams,
      responseType,
    });

    if (response.status < 200 || response.status >= 300) {
      throw new Error(
        `Deepgram API error: ${response.status} - ${JSON.stringify(response.body)}`
      );
    }

    return response;
  }
}

export function createDeepgramClient(apiKey: string): DeepgramClient {
  return new DeepgramClient(apiKey);
}
