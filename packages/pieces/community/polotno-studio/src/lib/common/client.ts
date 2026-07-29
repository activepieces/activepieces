import {
  AuthenticationType,
  HttpError,
  HttpMethod,
  type HttpRequest,
  type HttpResponse,
  httpClient,
} from '@activepieces/pieces-common';
import { BASE_URL, MAX_RATE_LIMIT_RETRIES, RETRY_AFTER_CAP_SECONDS } from './constants';
import { toFriendlyError } from './errors';

export type SendFn = <T>(request: HttpRequest) => Promise<HttpResponse<T>>;

export interface RequestOptions {
  path: string;
  method?: HttpMethod;
  body?: unknown;
  queryParams?: Record<string, string>;
  headers?: Record<string, string>;
}

export interface PolotnoClient {
  request<T>(options: RequestOptions): Promise<T>;
}

export interface ClientDeps {
  send?: SendFn;
  sleep?: (ms: number) => Promise<void>;
}

function backoffMs(attempt: number): number {
  const base = Math.min(2 ** attempt, RETRY_AFTER_CAP_SECONDS) * 1_000;
  return base + Math.floor(Math.random() * 500);
}

export function createClient(apiKey: string, deps: ClientDeps = {}): PolotnoClient {
  const send: SendFn = deps.send ?? (<T>(request: HttpRequest): Promise<HttpResponse<T>> => httpClient.sendRequest(request));
  const sleep = deps.sleep ?? ((ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)));

  return {
    async request<T>(options: RequestOptions): Promise<T> {
      const request: HttpRequest = {
        method: options.method ?? HttpMethod.GET,
        url: `${BASE_URL}${options.path}`,
        authentication: { type: AuthenticationType.BEARER_TOKEN, token: apiKey },
        ...(options.body === undefined ? {} : { body: options.body }),
        ...(options.queryParams === undefined ? {} : { queryParams: options.queryParams }),
        ...(options.headers === undefined ? {} : { headers: options.headers }),
      };

      for (let attempt = 0; ; attempt++) {
        try {
          const response = await send<T>(request);
          return response.body;
        } catch (error) {
          const isRateLimit = error instanceof HttpError && error.response.status === 429;
          if (!isRateLimit || attempt >= MAX_RATE_LIMIT_RETRIES) {
            throw toFriendlyError(error);
          }
          await sleep(backoffMs(attempt));
        }
      }
    },
  };
}
