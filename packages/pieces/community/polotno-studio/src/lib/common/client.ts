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

export type SendFn = (request: HttpRequest) => Promise<HttpResponse>;

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

/**
 * Delay before retrying a rate-limited request.
 *
 * The API sends `Retry-After`, but it is unreadable here: the platform's
 * `fetch-http-client` constructs `HttpError` with only `{ status, responseBody }`
 * and discards the response headers before throwing, so no header survives to
 * this point. We therefore back off exponentially with jitter, bounded by
 * `RETRY_AFTER_CAP_SECONDS`. Not reading the header also removes any chance of a
 * forged one stalling a flow.
 */
function backoffMs(attempt: number): number {
  const base = Math.min(2 ** attempt, RETRY_AFTER_CAP_SECONDS) * 1_000;
  return base + Math.floor(Math.random() * 500);
}

/**
 * Thin wrapper over the platform HTTP client.
 *
 * Activepieces gives pieces no rate-limit layer and its own retry logic covers
 * 5xx only, so 429 handling lives here. Retries stay small so a retrying request
 * cannot outlive AP_FLOW_TIMEOUT_SECONDS.
 */
export function createClient(apiKey: string, deps: ClientDeps = {}): PolotnoClient {
  const send: SendFn = deps.send ?? ((request) => httpClient.sendRequest(request));
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
          const response = await send(request);
          return response.body as T;
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
