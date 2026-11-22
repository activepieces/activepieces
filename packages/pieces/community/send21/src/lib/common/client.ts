import {
  AuthenticationType,
  HttpError,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { SEND21_API_BASE, SEND21_ORIGIN } from './constants';

function apiKey(raw: string): string {
  return raw.replace(/^Bearer\s+/i, '').trim();
}

function mapError(error: unknown): Error {
  if (!(error instanceof HttpError)) {
    return error instanceof Error ? error : new Error(String(error));
  }
  const status = error.response.status;
  const body = error.response.body as { title?: string; detail?: string; message?: string } | undefined;
  const message = body?.detail ?? body?.title ?? body?.message ?? JSON.stringify(body);
  if (status === 422 && String(message).includes('address_not_approved')) {
    return new Error(
      '422 address_not_approved: this receiving address is not approved in the send21 account, so nothing was created. Approve it in send21 (signed in, with a passkey or authenticator code), then retry.'
    );
  }
  if (status === 402) {
    return new Error(
      `402: accrued send21 fees must be settled first (POST /fees/accrued/settle). ${message}`
    );
  }
  return new Error(`send21 API error (${status}): ${message}`);
}

export async function send21Request<T>(params: {
  apiKey: string;
  method: HttpMethod;
  path: string;
  body?: unknown;
  query?: Record<string, string>;
  idempotencyKey?: string;
}): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
  if (params.idempotencyKey) headers['Idempotency-Key'] = params.idempotencyKey;

  try {
    const response = await httpClient.sendRequest<T>({
      method: params.method,
      url: `${SEND21_API_BASE}${params.path}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: apiKey(params.apiKey),
      },
      headers,
      queryParams: params.query,
      body: params.body,
    });
    return response.body;
  } catch (error) {
    throw mapError(error);
  }
}

export function payLinkFrom<T extends { payPath?: string | null; payLink?: string }>(body: T): T & { payLink?: string } {
  if (body.payPath && !body.payLink) {
    return { ...body, payLink: `${SEND21_ORIGIN}${body.payPath}` };
  }
  return body;
}

export function authKey(auth: unknown): string {
  if (typeof auth === 'string') return auth;
  if (auth && typeof auth === 'object' && 'secret_text' in auth) {
    return String((auth as { secret_text: string }).secret_text);
  }
  return String(auth ?? '');
}
