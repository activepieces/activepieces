import { httpClient, HttpMethod, HttpRequest, AuthenticationType } from '@activepieces/pieces-common';

export interface PromptHubClientOptions {
  baseUrl?: string;
  timeoutMs?: number;
  maxRetries?: number;
  initialBackoffMs?: number;
}

export class PromptHubClient {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;
  private readonly initialBackoffMs: number;

  constructor(private readonly apiKey: string, options?: PromptHubClientOptions) {
    this.baseUrl = (options?.baseUrl ?? 'https://app.prompthub.us/api/v1').replace(/\/$/, '');
    this.timeoutMs = options?.timeoutMs ?? 30000;
    this.maxRetries = options?.maxRetries ?? 3;
    this.initialBackoffMs = options?.initialBackoffMs ?? 500;
  }

  async validateToken(): Promise<boolean> {
    try {
      await this.get('/me');
      return true;
    } catch (e: any) {
      if (e?.statusCode === 401 || e?.statusCode === 403) return false;
      throw e;
    }
  }

  async listProjects(teamId: number, query?: Record<string, string | number | boolean | undefined>) {
    return this.get(`/teams/${teamId}/projects`, query);
  }

  async getProjectHead(projectId: number, query?: Record<string, string | number | boolean | undefined>) {
    return this.get(`/projects/${projectId}/head`, query);
  }

  async runProject(projectId: number, body: any, timeoutMs?: number) {
    return this.post(`/projects/${projectId}/run`, body, timeoutMs);
  }

  private async get(path: string, query?: Record<string, string | number | boolean | undefined>) {
    const url = `${this.baseUrl}${path}`;
    const req: HttpRequest = {
      method: HttpMethod.GET,
      url,
      queryParams: this.buildQuery(query),
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: this.apiKey,
      },
      timeout: this.timeoutMs,
      headers: {
        Accept: 'application/json',
      },
    };
    return this.sendWithRetry(req);
  }

  private async post(path: string, body: unknown, timeoutOverrideMs?: number) {
    const url = `${this.baseUrl}${path}`;
    const req: HttpRequest = {
      method: HttpMethod.POST,
      url,
      body,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: this.apiKey,
      },
      timeout: timeoutOverrideMs ?? this.timeoutMs,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    };
    return this.sendWithRetry(req);
  }

  private async sendWithRetry(request: HttpRequest): Promise<any> {
    let attempt = 0;
    let lastError: any;
    while (attempt <= this.maxRetries) {
      try {
        const res = await httpClient.sendRequest<any>(request);
        const status = res.status ?? 200;
        if (status >= 200 && status < 300) {
          return res.body;
        }
        const error = new Error(`PromptHub API error ${status}`) as any;
        error.statusCode = status;
        error.body = res.body;
        throw error;
      } catch (err: any) {
        lastError = err;
        const status = err?.statusCode ?? err?.status;
        const isRateLimit = status === 429;
        const isAuth = status === 401 || status === 403;
        const isServer = status >= 500 && status < 600;
        if (isAuth) {
          err.message = 'Unauthorized or forbidden. Check PromptHub token and permissions (team/project access).';
          throw err;
        }
        if (!(isRateLimit || isServer)) {
          throw err;
        }
        if (attempt === this.maxRetries) {
          break;
        }
        const backoff = this.exponentialBackoffWithJitter(attempt);
        await this.sleep(backoff);
        attempt++;
      }
    }
    throw lastError;
  }

  private buildQuery(query?: Record<string, string | number | boolean | undefined>): Record<string, string> | undefined {
    if (!query) return undefined;
    const out: Record<string, string> = {};
    Object.entries(query).forEach(([k, v]) => {
      if (v === undefined || v === null) return;
      out[k] = String(v);
    });
    return out;
  }

  private exponentialBackoffWithJitter(attempt: number): number {
    const base = this.initialBackoffMs * Math.pow(2, attempt);
    const jitter = Math.floor(Math.random() * this.initialBackoffMs);
    return base + jitter;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
