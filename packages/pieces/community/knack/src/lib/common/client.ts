import {
  httpClient,
  HttpError,
  HttpMethod,
  HttpRequest,
  HttpMessageBody,
  QueryParams,
} from '@activepieces/pieces-common';
import { AppConnectionValueForAuthProperty } from '@activepieces/pieces-framework';
import { knackAuth } from './auth';

export async function knackApiCall<T extends HttpMessageBody>({
  method,
  resourceUri,
  query,
  body,
  auth,
}: KnackApiCallParams): Promise<T> {
  const { apiKey, applicationId } = auth.props;

  if (!apiKey || !applicationId) {
    throw new Error('Knack API key and Application ID are required for authentication');
  }

  const queryParams: QueryParams = {};
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== null && value !== undefined) {
        queryParams[key] = String(value);
      }
    }
  }

  const request: HttpRequest = {
    method,
    url: `${KNACK_BASE_URL}${resourceUri}`,
    headers: {
      'X-Knack-Application-ID': applicationId,
      'X-Knack-REST-API-Key': apiKey,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    queryParams,
    body,
  };

  try {
    const response = await httpClient.sendRequest<T>(request);
    return response.body;
  } catch (error) {
    throw toKnackError(error);
  }
}

export function toKnackError(error: unknown): Error {
  if (error instanceof HttpError) {
    const status = error.response.status;
    const vendorMessage = extractKnackMessage(error.response.body);
    const hint = STATUS_HINTS[status];
    const parts = [`Knack API error (HTTP ${status})`];
    if (vendorMessage) {
      parts.push(vendorMessage);
    }
    if (hint) {
      parts.push(hint);
    }
    return new KnackApiError({
      message: parts.join(': '),
      status,
      responseBody: error.response.body,
    });
  }
  if (error instanceof Error) {
    return error;
  }
  return new Error(String(error));
}

export function assertKnackRecordFound({
  record,
  recordId,
  objectKey,
}: {
  record: Record<string, unknown>;
  recordId: string;
  objectKey: string;
}): void {
  if (typeof record['id'] !== 'string' || record['id'].length === 0) {
    throw new KnackApiError({
      message: `Knack API error (HTTP 404): Record ${recordId} not found in ${objectKey}. Check the object key and record ID.`,
      status: 404,
      responseBody: record,
    });
  }
}

export function assertKnackDeleteConfirmed({
  response,
  recordId,
  objectKey,
}: {
  response: Record<string, unknown> | null | undefined;
  recordId: string;
  objectKey: string;
}): void {
  if (response?.['delete'] !== true) {
    throw new KnackApiError({
      message: `Knack API error (HTTP 404): Record ${recordId} not found in ${objectKey}, nothing was deleted. Check the object key and record ID.`,
      status: 404,
      responseBody: response,
    });
  }
}

export function extractKnackMessage(body: unknown): string | undefined {
  if (body === null || body === undefined) {
    return undefined;
  }
  if (typeof body === 'string') {
    const trimmed = body.trim();
    if (trimmed.length === 0) {
      return undefined;
    }
    try {
      const parsed: unknown = JSON.parse(trimmed);
      if (typeof parsed === 'object' && parsed !== null) {
        return extractKnackMessage(parsed);
      }
    } catch {
      return trimmed.slice(0, 500);
    }
    return trimmed.slice(0, 500);
  }
  if (typeof body !== 'object') {
    return String(body);
  }
  const messages: string[] = [];
  if ('errors' in body && Array.isArray(body.errors)) {
    for (const entry of body.errors) {
      if (typeof entry === 'string') {
        messages.push(entry);
      } else if (typeof entry === 'object' && entry !== null && 'message' in entry && typeof entry.message === 'string') {
        messages.push(entry.message);
      }
    }
  }
  if (messages.length === 0 && 'message' in body && typeof body.message === 'string') {
    messages.push(body.message);
  }
  if (messages.length === 0 && 'error' in body && typeof body.error === 'string') {
    messages.push(body.error);
  }
  if (messages.length === 0) {
    return JSON.stringify(body).slice(0, 500);
  }
  return messages.join('; ');
}

class KnackApiError extends Error {
  readonly status: number;
  readonly responseBody: unknown;

  constructor({ message, status, responseBody }: { message: string; status: number; responseBody: unknown }) {
    super(message);
    this.name = 'KnackApiError';
    this.status = status;
    this.responseBody = responseBody;
  }
}

const KNACK_BASE_URL = 'https://api.knack.com/v1';

const STATUS_HINTS: Record<number, string> = {
  401: 'Check the API Key and Application ID in the connection.',
  404: 'Check the object key and record ID.',
  403: 'The API key does not have access to this resource.',
  429: 'Knack rate limit or daily API quota reached. Wait before retrying.',
};

export type KnackAuthValue = AppConnectionValueForAuthProperty<typeof knackAuth>;

export type KnackApiCallParams = {
  method: HttpMethod;
  resourceUri: string;
  query?: Record<string, string | number | undefined>;
  body?: unknown;
  auth: KnackAuthValue;
};
