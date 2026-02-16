import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import {
  ValidateEmailProps,
  ValidatedMailsValidationResponse,
} from './types';

const MIN_DNS_TIMEOUT_MS = 200;
const MAX_DNS_TIMEOUT_MS = 5000;
const DEFAULT_DNS_TIMEOUT_MS = 1500;

const ERR_UNAUTHORIZED = 'Unauthorized: Invalid API key';
const ERR_INSUFFICIENT_CREDITS = 'Insufficient credits';
const ERR_RATE_LIMITED = 'Rate limited';
const ERR_SERVICE_UNAVAILABLE = 'Service unavailable';
const VALIDATE_URL = 'https://api.validatedmails.com/validate';
const VALIDATE_URL_FALLBACK = 'https://api.validatedmails.com/validate/';

export function sanitizeEmail(email: string): string {
  return email.trim();
}

export function assertEmailInput(email: string): void {
  const sanitizedEmail = sanitizeEmail(email);

  if (!sanitizedEmail.includes('@')) {
    throw new Error('Email address must contain @');
  }
}

export function normalizeDnsTimeoutMs(dnsTimeoutMs?: number): number {
  if (dnsTimeoutMs === undefined || Number.isNaN(dnsTimeoutMs)) {
    return DEFAULT_DNS_TIMEOUT_MS;
  }

  return Math.min(Math.max(Math.round(dnsTimeoutMs), MIN_DNS_TIMEOUT_MS), MAX_DNS_TIMEOUT_MS);
}

export function mapHttpStatusToError(status: number): Error {
  if (status === 401) {
    return new Error(ERR_UNAUTHORIZED);
  }

  if (status === 402) {
    return new Error(ERR_INSUFFICIENT_CREDITS);
  }

  if (status === 429) {
    return new Error(ERR_RATE_LIMITED);
  }

  if (status >= 500) {
    return new Error(ERR_SERVICE_UNAVAILABLE);
  }

  return new Error('Request failed');
}

export function isTransportOrServerError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const maybeResponse = (error as Error & { response?: { status?: number } }).response;
  if (maybeResponse?.status && maybeResponse.status >= 500) {
    return true;
  }

  return !maybeResponse;
}

function getErrorStatus(error: unknown): number | undefined {
  if (!(error instanceof Error)) {
    return undefined;
  }

  return (error as Error & { response?: { status?: number } }).response?.status;
}

function shouldRetryWithFallbackUrl(error: unknown): boolean {
  const status = getErrorStatus(error);
  return status === 307 || status === 308 || status === 404 || status === 405;
}

export function toValidationOutput(
  body: Record<string, unknown>
): ValidatedMailsValidationResponse {
  return {
    is_valid: Boolean(body['is_valid']),
    score: Number(body['score'] ?? 0),
    email: String(body['email'] ?? ''),
    normalized: String(body['normalized'] ?? ''),
    state: String(body['state'] ?? ''),
    reason: String(body['reason'] ?? ''),
    domain: String(body['domain'] ?? ''),
    free: Boolean(body['free']),
    role: Boolean(body['role']),
    disposable: Boolean(body['disposable']),
    accept_all: Boolean(body['accept_all']),
    tag: Boolean(body['tag']),
    smtp_ok: Boolean(body['smtp_ok']),
    mx_record:
      typeof body['mx_record'] === 'string' ? String(body['mx_record']) : undefined,
    syntax_ok: Boolean(body['syntax_ok']),
    mx_ok: Boolean(body['mx_ok']),
    a_ok: Boolean(body['a_ok']),
    response_ms: Number(body['response_ms'] ?? 0),
    mx_hosts: Array.isArray(body['mx_hosts'])
      ? body['mx_hosts'].map((item) => String(item))
      : [],
    status: asStatus(body['status']),
    reasons: Array.isArray(body['reasons'])
      ? body['reasons'].map((item) => String(item))
      : [],
    trace_id: String(body['trace_id'] ?? ''),
  };
}

function asStatus(value: unknown): 'valid' | 'invalid' | 'unknown' {
  if (value === 'valid' || value === 'invalid' || value === 'unknown') {
    return value;
  }
  return 'unknown';
}

export async function executeValidateEmailRequest(
  propsValue: ValidateEmailProps,
  apiKey: string,
  requestSender = httpClient.sendRequest
): Promise<ValidatedMailsValidationResponse> {
  const sanitizedEmail = sanitizeEmail(propsValue.email);
  assertEmailInput(sanitizedEmail);

  const dnsTimeoutMs = normalizeDnsTimeoutMs(propsValue.dnsTimeoutMs);
  const request = {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    timeout: 10000,
  };

  const send = async (url: string) => {
    if (propsValue.mode === 'GET') {
      return requestSender({
        method: HttpMethod.GET,
        url,
        ...request,
        queryParams: {
          email: sanitizedEmail,
          dns_timeout_ms: String(dnsTimeoutMs),
        },
      });
    }

    return requestSender({
      method: HttpMethod.POST,
      url,
      ...request,
      body: {
        email: sanitizedEmail,
        dns_timeout_ms: dnsTimeoutMs,
      },
    });
  };

  const sendWithFallbackUrl = async () => {
    try {
      return await send(VALIDATE_URL);
    } catch (error) {
      if (shouldRetryWithFallbackUrl(error)) {
        return send(VALIDATE_URL_FALLBACK);
      }
      throw error;
    }
  };

  try {
    const response = await sendWithFallbackUrl();
    return toValidationOutput(response.body as Record<string, unknown>);
  } catch (error) {
    if (isTransportOrServerError(error)) {
      try {
        const retriedResponse = await sendWithFallbackUrl();
        return toValidationOutput(retriedResponse.body as Record<string, unknown>);
      } catch (retryError) {
        const status = getErrorStatus(retryError);
        if (status) {
          throw mapHttpStatusToError(status);
        }
        throw new Error(ERR_SERVICE_UNAVAILABLE);
      }
    }

    const status = getErrorStatus(error);
    if (status) {
      throw mapHttpStatusToError(status);
    }

    throw new Error('Request failed');
  }
}
