import {
  AuthenticationType,
  httpClient,
  HttpMethod,
  HttpRequest,
  QueryParams,
} from '@activepieces/pieces-common';
import { HedyApiError } from './errors';
import {
  ApiErrorPayload,
  HedyResponse,
  PaginatedResponse,
  PaginationInfo,
} from './types';

const BASE_URL = 'https://api.hedy.bot';
const DEFAULT_LIMIT = 50;
const MAX_RESULTS = 1000;
const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 500;

export interface PaginationOptions {
  returnAll?: boolean;
  limit?: number;
  after?: string;
  before?: string;
  topicId?: string;
  format?: 'standard' | 'zapier';
}

interface RequestOptions {
  method: HttpMethod;
  path: string;
  body?: unknown;
  queryParams?: Record<string, unknown>;
}

export class HedyApiClient {
  constructor(private readonly apiKey: string) {}

  async request<T>(options: RequestOptions): Promise<HedyResponse<T>> {
    return this.withRetry(() => this.performRequest<T>(options));
  }

  async paginate<T>(path: string, options: PaginationOptions = {}): Promise<T[]> {
    const { returnAll = false, limit = DEFAULT_LIMIT, ...rest } = options;
    const collected: T[] = [];
    let cursor = rest.after;
    let hasMore = true;

    while (hasMore) {
      const query = {
        ...rest,
        limit: returnAll ? Math.min(limit, 100) : limit,
        after: cursor,
      };

      const response = await this.request<T>({
        method: HttpMethod.GET,
        path,
        queryParams: query,
      });

      const { data, pagination } = normalizeListResult(response);
      collected.push(...data);

      if (!returnAll && collected.length >= limit) {
        // When NOT returning all, stop when we hit the limit
        hasMore = false;
      } else if (pagination?.hasMore && pagination.next) {
        // Continue if there's more data available
        cursor = pagination.next;
        hasMore = true;
      } else {
        // No more data available
        hasMore = false;
      }

      if (collected.length >= MAX_RESULTS) {
        hasMore = false;
      }
    }

    return returnAll ? collected : collected.slice(0, limit);
  }

  private async performRequest<T>({ method, path, body, queryParams }: RequestOptions): Promise<HedyResponse<T>> {
    const qs: QueryParams = {};

    if (queryParams) {
      for (const [key, value] of Object.entries(queryParams)) {
        if (value === undefined || value === null || value === '') {
          continue;
        }
        qs[key] = String(value);
      }
    }

    const request: HttpRequest = {
      method,
      url: `${BASE_URL}${path}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: this.apiKey,
      },
      headers: {
        'User-Agent': 'activepieces-hedy/1.0.0',
        'Content-Type': 'application/json',
      },
      body,
      queryParams: qs,
    };

    try {
      const response = await httpClient.sendRequest<HedyResponse<T>>(request);
      const { body: responseBody } = response;

      if (isErrorPayload(responseBody)) {
        throw HedyApiError.fromPayload(responseBody, undefined, response.status);
      }

      return responseBody;
    } catch (error: any) {
      const apiErrorPayload: ApiErrorPayload | undefined = error?.response?.body;
      const statusCode: number | undefined = error?.response?.status;
      throw HedyApiError.fromPayload(apiErrorPayload, error, statusCode);
    }
  }

  private async withRetry<T>(operation: () => Promise<T>): Promise<T> {
    let attempt = 0;
    let backoff = INITIAL_BACKOFF_MS;

    while (attempt < MAX_RETRIES) {
      try {
        return await operation();
      } catch (error) {
        const isLastAttempt = attempt === MAX_RETRIES - 1;
        if (!(error instanceof HedyApiError) || !this.shouldRetry(error) || isLastAttempt) {
          throw error;
        }

        await this.delay(backoff);
        backoff *= 2;
        attempt += 1;
      }
    }

    // The loop above either returns or throws, but TypeScript expects a return.
    throw new HedyApiError('unknown_error', 'Request failed after multiple retries.');
  }

  private shouldRetry(error: HedyApiError): boolean {
    return error.code === 'rate_limit_exceeded';
  }

  private async delay(duration: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, duration));
  }
}

function isErrorPayload<T>(body: HedyResponse<T>): body is ApiErrorPayload {
  return Boolean(body && typeof body === 'object' && 'error' in body);
}

function normalizeListResult<T>(result: HedyResponse<T>): {
  data: T[];
  pagination?: PaginationInfo;
} {
  if (Array.isArray(result)) {
    return { data: result };
  }

  if (result && typeof result === 'object') {
    const maybePaginated = result as PaginatedResponse<T>;
    if (Array.isArray(maybePaginated.data)) {
      return {
        data: maybePaginated.data,
        pagination: maybePaginated.pagination,
      };
    }

    const maybeData = (result as { data?: unknown }).data;
    if (Array.isArray(maybeData)) {
      return { data: maybeData as T[] };
    }
  }

  return {
    data: result ? [result as T] : [],
  };
}

export function unwrapResource<T>(result: HedyResponse<T>): T {
  if (result && typeof result === 'object') {
    const data = (result as { data?: unknown }).data;
    if (data && !Array.isArray(data)) {
      return data as T;
    }
  }

  return result as T;
}
