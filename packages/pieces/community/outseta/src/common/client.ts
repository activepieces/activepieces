import { HttpMethod, httpClient } from '@activepieces/pieces-common';

type OutsetaAuth = {
  domain: string;
  apiKey: string;
  apiSecret: string;
};

export class OutsetaClient {
  private readonly baseUrl: string;
  private readonly authHeader: string;

  constructor(auth: OutsetaAuth) {
    // Remove trailing slash if present
    this.baseUrl = auth.domain.replace(/\/$/, '');
    // Outseta Admin API auth format
    this.authHeader = `Outseta ${auth.apiKey}:${auth.apiSecret}`;
  }

  async get<T>(path: string): Promise<T> {
    const response = await httpClient.sendRequest<T>({
      method: HttpMethod.GET,
      url: `${this.baseUrl}${path}`,
      headers: {
        Authorization: this.authHeader,
        'Content-Type': 'application/json',
      },
    });

    if (response.status !== 200) {
      throw new Error(
        `Outseta API error (${response.status}): ${JSON.stringify(response.body)}`
      );
    }

    return response.body as T;
  }
}
