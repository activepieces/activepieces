import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export interface CognosAuth {
  serverUrl: string;
  namespace: string;
  username: string;
  password: string;
}

export class CognosClient {
  private auth: CognosAuth;
  private sessionCookies?: string;

  constructor(auth: CognosAuth) {
    this.auth = auth;
  }

  async createSession(): Promise<string> {
    const parameters = [
      { name: 'CAMNamespace', value: this.auth.namespace },
      { name: 'CAMUsername', value: this.auth.username },
      { name: 'CAMPassword', value: this.auth.password }
    ];

    const response = await httpClient.sendRequest({
      method: HttpMethod.PUT,
      url: `${this.auth.serverUrl.replace(/\/$/, '')}/api/v1/session`,
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        parameters,
      },
    });

    if (response.status >= 200 && response.status < 300) {
      const cookies = response.headers?.['set-cookie'];
      this.sessionCookies = cookies ? (Array.isArray(cookies) ? cookies.join('; ') : cookies) : '';
      return this.sessionCookies;
    } else {
      throw new Error(`Failed to create session: ${response.status} ${response.body}`);
    }
  }

  async makeAuthenticatedRequest(endpoint: string, method: HttpMethod = HttpMethod.GET, body?: any) {
    if (!this.sessionCookies) {
      await this.createSession();
    }

    const response = await httpClient.sendRequest({
      method,
      url: `${this.auth.serverUrl.replace(/\/$/, '')}/api/v1${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        'Cookie': this.sessionCookies || '',
      },
      body,
    });

    return response;
  }

  getBaseUrl(): string {
    return `${this.auth.serverUrl.replace(/\/$/, '')}/api/v1`;
  }
}