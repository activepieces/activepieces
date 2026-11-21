import { HttpMethod } from '@activepieces/pieces-common';

const RATE_LIMIT_WORDINGS = /developer over rate|account over queries per second limit|account over rate limit/i;

const MAX_DETAIL_LENGTH = 300;

const MESSAGES = {
  RECONNECT:
    "Sprinklr rejected the connection. Reconnect it. This happens when the same API key is used elsewhere or the user's password changed.",
  HOURLY_LIMIT: "Sprinklr's API limit was reached (1,000 requests per hour by default). Try again later.",
};

export class SprinklrApiError extends Error {
  readonly status: number;
  readonly kind: SprinklrErrorKind;
  readonly method: HttpMethod;
  readonly path: string;
  readonly detail: string;

  constructor({ message, status, kind, method, path, detail }: SprinklrApiErrorParams) {
    super(message);
    this.name = 'SprinklrApiError';
    this.status = status;
    this.kind = kind;
    this.method = method;
    this.path = path;
    this.detail = detail;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isHtml(text: string): boolean {
  return /^\s*<(!doctype|html|head|body)/i.test(text) || /<html[\s>]/i.test(text);
}

function truncate(text: string): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  return clean.length > MAX_DETAIL_LENGTH ? `${clean.slice(0, MAX_DETAIL_LENGTH)}...` : clean;
}

function describeHtml(text: string): string {
  const title = /<title[^>]*>([^<]*)<\/title>/i.exec(text)?.[1]?.trim();
  return title ? `an HTML error page (${title})` : 'an HTML error page';
}

function errorEntryMessage(entry: unknown): string | undefined {
  if (typeof entry === 'string' && entry.trim().length > 0) {
    return entry.trim();
  }
  if (!isRecord(entry)) {
    return undefined;
  }
  const message = entry['message'];
  if (typeof message === 'string' && message.trim().length > 0) {
    return message.trim();
  }
  const code = entry['code'];
  if (typeof code === 'string' || typeof code === 'number') {
    return `error code ${code}`;
  }
  return undefined;
}

function firstErrorMessage(body: unknown): string | undefined {
  if (!isRecord(body)) {
    return undefined;
  }
  const errors = body['errors'];
  if (!Array.isArray(errors)) {
    return undefined;
  }
  for (const entry of errors) {
    const message = errorEntryMessage(entry);
    if (message) {
      return message;
    }
  }
  return undefined;
}

function describeBody(body: unknown): string {
  if (body === undefined || body === null || body === '') {
    return 'no details';
  }
  if (typeof body === 'string') {
    return isHtml(body) ? describeHtml(body) : truncate(body);
  }
  const fromErrors = firstErrorMessage(body);
  if (fromErrors) {
    return truncate(fromErrors);
  }
  if (isRecord(body)) {
    for (const key of ['message', 'error_description', 'error']) {
      const value = body[key];
      if (typeof value === 'string' && value.trim().length > 0) {
        return truncate(value);
      }
    }
  }
  return truncate(JSON.stringify(body));
}

function bodyText(body: unknown): string {
  if (typeof body === 'string') {
    return body;
  }
  if (body === undefined) {
    return '';
  }
  return JSON.stringify(body);
}

function isRateLimited({ status, body }: { status: number; body: unknown }): boolean {
  if (status === 429) {
    return true;
  }
  return status === 403 && RATE_LIMIT_WORDINGS.test(bodyText(body));
}

function fromResponse({
  status,
  body,
  method,
  path,
  sideEffectPossible,
}: {
  status: number;
  body: unknown;
  method: HttpMethod;
  path: string;
  sideEffectPossible: boolean;
}): SprinklrApiError {
  const detail = describeBody(body);
  const where = `${method} ${path}`;
  const base = { status, method, path, detail };
  if (isRateLimited({ status, body })) {
    return new SprinklrApiError({ ...base, kind: 'rate_limit', message: MESSAGES.HOURLY_LIMIT });
  }
  if (status === 401) {
    return new SprinklrApiError({ ...base, kind: 'auth', message: MESSAGES.RECONNECT });
  }
  if (status === 403) {
    return new SprinklrApiError({
      ...base,
      kind: 'forbidden',
      message: `Sprinklr refused ${where} (403): ${detail}. Check that the Sprinklr user of this connection has permission for it.`,
    });
  }
  if (status === 404) {
    return new SprinklrApiError({
      ...base,
      kind: 'not_found',
      message: `Sprinklr found nothing for ${where} (404): ${detail}. Check the ID you entered and the connection's Environment.`,
    });
  }
  if (status === 421) {
    return new SprinklrApiError({
      ...base,
      kind: 'wrong_environment',
      message: `Sprinklr says ${where} went to the wrong environment (421): ${detail}. Edit the connection, check the Environment and reconnect.`,
    });
  }
  if (status >= 500) {
    const advice = sideEffectPossible
      ? 'It may still have gone through, so check Sprinklr before you run it again.'
      : 'Try again in a few minutes.';
    return new SprinklrApiError({
      ...base,
      kind: 'server',
      message: `Sprinklr had a server error on ${where} (${status}): ${detail}. ${advice}`,
    });
  }
  if (status >= 400) {
    return new SprinklrApiError({
      ...base,
      kind: 'bad_request',
      message: `Sprinklr rejected ${where} (${status}): ${detail}. Check the values you entered.`,
    });
  }
  return new SprinklrApiError({
    ...base,
    kind: 'api',
    message: `Sprinklr returned an error for ${where}: ${detail}.`,
  });
}

function fromNetwork({
  error,
  method,
  path,
  sideEffectPossible,
}: {
  error: unknown;
  method: HttpMethod;
  path: string;
  sideEffectPossible: boolean;
}): SprinklrApiError {
  const detail = error instanceof Error ? truncate(error.message) : truncate(String(error));
  const advice = sideEffectPossible
    ? 'It may still have gone through, so check Sprinklr before you run it again.'
    : 'Check that Sprinklr is reachable and try again.';
  return new SprinklrApiError({
    status: 0,
    kind: 'network',
    method,
    path,
    detail,
    message: `Sprinklr did not answer ${method} ${path} (${detail}). ${advice}`,
  });
}

export const sprinklrErrors = {
  MESSAGES,
  isRecord,
  isRateLimited,
  firstErrorMessage,
  describeBody,
  fromResponse,
  fromNetwork,
};

export type SprinklrErrorKind =
  | 'auth'
  | 'rate_limit'
  | 'forbidden'
  | 'not_found'
  | 'wrong_environment'
  | 'bad_request'
  | 'server'
  | 'network'
  | 'api';

type SprinklrApiErrorParams = {
  message: string;
  status: number;
  kind: SprinklrErrorKind;
  method: HttpMethod;
  path: string;
  detail: string;
};
