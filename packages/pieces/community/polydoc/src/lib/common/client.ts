import { httpClient, HttpMethod, type HttpHeaders } from '@activepieces/pieces-common';
import { DEFAULT_BASE_URL } from './constants';
import type { JsonObject, PolyDocRequest } from './types';

export interface PolyDocAuthValue {
  apiKey: string;
  sandbox: boolean;
}

export interface PolyDocResponse {
  status: number;
  headers: HttpHeaders;
  body: unknown;
}

/**
 * Normalize the connection value into PolyDoc credential fields. Inside an
 * action the value arrives wrapped as `{ type, props }`; inside the auth
 * `validate` hook it arrives as the bare props object, so accept either.
 */
export function resolveAuth(auth: unknown): PolyDocAuthValue {
  const raw = (auth ?? {}) as Record<string, unknown>;
  const props =
    raw['props'] && typeof raw['props'] === 'object'
      ? (raw['props'] as Record<string, unknown>)
      : raw;
  return {
    apiKey: String(props['apiKey'] ?? ''),
    sandbox: props['sandbox'] === true,
  };
}

/**
 * Perform an authenticated PolyDoc API call. Sets the Bearer token and the
 * per-request X-Sandbox header, and requests bytes or JSON depending on the
 * delivery mode. Returns the full response so callers can read binary bytes +
 * headers or the JSON delivery confirmation.
 */
export async function polyDocRequest(
  auth: PolyDocAuthValue,
  request: PolyDocRequest,
): Promise<PolyDocResponse> {
  const baseUrl = DEFAULT_BASE_URL.replace(/\/+$/, '');
  const res = await httpClient.sendRequest({
    method: HttpMethod.POST,
    url: `${baseUrl}${request.endpoint}`,
    headers: {
      Authorization: `Bearer ${auth.apiKey}`,
      'Content-Type': 'application/json',
      'X-Sandbox': auth.sandbox ? 'true' : 'false',
    },
    body: request.body,
    responseType: request.isBinary ? 'arraybuffer' : 'json',
  });
  return { status: res.status, headers: res.headers ?? {}, body: res.body };
}

/**
 * Best-effort extraction of PolyDoc's `{ error, message }` from a thrown HTTP
 * error, including the binary path where the error body arrives as bytes.
 */
export function extractApiErrorMessage(error: unknown): string | undefined {
  const err = error as { response?: { body?: unknown } } | undefined;
  let payload: unknown = err?.response?.body;
  if (payload instanceof ArrayBuffer) {
    payload = Buffer.from(payload).toString('utf8');
  } else if (Buffer.isBuffer(payload)) {
    payload = payload.toString('utf8');
  }
  if (typeof payload === 'string') {
    const text = payload;
    try {
      payload = JSON.parse(text);
    } catch {
      return text || undefined;
    }
  }
  if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
    const p = payload as JsonObject;
    const message = p['message'];
    if (typeof message === 'string') {
      return message;
    }
    const errorField = p['error'];
    if (typeof errorField === 'string') {
      return errorField;
    }
  }
  return undefined;
}
