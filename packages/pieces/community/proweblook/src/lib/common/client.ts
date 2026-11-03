import {
  httpClient,
  HttpError,
  HttpMethod,
} from '@activepieces/pieces-common';
import { ProweblookEnvelope, ProweblookOperation } from './types';

export const PROWEBLOOK_BASE_URL = 'https://proweblook.com/api/v1/zapier';

export class ProweblookApiError extends Error {
  readonly status?: number;
  readonly code?: string;

  constructor(params: { message: string; status?: number; code?: string }) {
    super(params.message);
    this.name = 'ProweblookApiError';
    this.status = params.status;
    this.code = params.code;
  }
}

export type ProweblookRequestParams = {
  apiKey: string;
  operation: ProweblookOperation;
  body: Record<string, unknown>;
};

async function post<T>({
  apiKey,
  operation,
  body,
}: ProweblookRequestParams): Promise<T> {
  let status: number;
  let rawBody: unknown;

  try {
    const response = await httpClient.sendRequest<ProweblookEnvelope<T>>({
      method: HttpMethod.POST,
      url: `${PROWEBLOOK_BASE_URL}/${operation}`,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body,
    });
    status = response.status;
    rawBody = response.body;
  } catch (error) {
    if (error instanceof HttpError) {
      const parsed = parseBody(error.response.body);
      const { code, message } = extractErrorFields(parsed);
      throw new ProweblookApiError({
        message: formatErrorMessage({
          code,
          message,
          status: error.response.status,
        }),
        status: error.response.status,
        code,
      });
    }
    throw error;
  }

  const parsed = parseBody(rawBody);
  if (
    !isRecord(parsed) ||
    parsed['ok'] !== true ||
    parsed['data'] === undefined ||
    parsed['data'] === null
  ) {
    const { code, message } = extractErrorFields(parsed);
    throw new ProweblookApiError({
      message: formatErrorMessage({ code, message, status }),
      status,
      code,
    });
  }

  return parsed['data'] as T;
}

function statusOf(error: unknown): number | undefined {
  if (error instanceof ProweblookApiError) {
    return error.status;
  }
  if (error instanceof HttpError) {
    return error.response.status;
  }
  return undefined;
}

function describeError(error: unknown, fallback: string): string {
  if (error instanceof ProweblookApiError) {
    return error.message;
  }
  if (error instanceof HttpError) {
    const { code, message } = extractErrorFields(parseBody(error.response.body));
    return formatErrorMessage({
      code,
      message,
      status: error.response.status,
    });
  }
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }
  return fallback;
}

function parseBody(value: unknown): unknown {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return undefined;
    }
  }
  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function asNonEmptyString(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim();
  }
  return undefined;
}

function extractErrorFields(body: unknown): {
  code?: string;
  message?: string;
} {
  if (!isRecord(body)) {
    return {};
  }
  const rawError = body['error'];
  const nested = isRecord(rawError) ? rawError : undefined;
  const code = asNonEmptyString(nested?.['code']) ?? asNonEmptyString(body['code']);
  const message =
    asNonEmptyString(nested?.['message']) ??
    asNonEmptyString(body['message']) ??
    asNonEmptyString(rawError);
  return { code, message };
}

function formatErrorMessage(params: {
  code?: string;
  message?: string;
  status?: number;
}): string {
  const { code, message, status } = params;
  if (message && code) {
    return `${message} (${code})`;
  }
  if (message) {
    return message;
  }
  if (code) {
    return `ProWebLook API error (${code})`;
  }
  if (status !== undefined) {
    return `ProWebLook API request failed with HTTP ${status}`;
  }
  return 'ProWebLook API returned an unexpected response.';
}

export const proweblookApi = {
  post,
  statusOf,
  describeError,
};
