import { HttpError } from '@activepieces/pieces-common';

interface ErrorEnvelope {
  type: string;
  code: string;
  message: string;
  param?: string;
  request_id?: string;
}

function readEnvelope(body: unknown): ErrorEnvelope | undefined {
  if (typeof body !== 'object' || body === null || !('error' in body)) return undefined;
  const err = body.error;
  if (typeof err !== 'object' || err === null || !('code' in err) || !('message' in err)) return undefined;
  if (typeof err.code !== 'string' || typeof err.message !== 'string') return undefined;
  const type = 'type' in err && typeof err.type === 'string' ? err.type : 'api_error';
  const param = 'param' in err && typeof err.param === 'string' ? err.param : undefined;
  const requestId = 'request_id' in err && typeof err.request_id === 'string' ? err.request_id : undefined;
  return {
    type,
    code: err.code,
    message: err.message,
    param,
    request_id: requestId,
  };
}

const FRIENDLY: Record<string, string> = {
  invalid_api_key: 'Invalid API key. Reconnect this piece with a key from Polotno Studio → API Keys.',
  revoked_api_key: 'This API key has been revoked. Create a new one in Polotno Studio and reconnect.',
  missing_api_key: 'No API key was sent. Reconnect this piece.',
  subscription_inactive: 'Your Polotno Studio subscription is not active. Renders are blocked until billing is resolved.',
  automation_disabled: 'Automation is disabled for this project. Enable it in the Polotno Studio dashboard.',
  idempotency_conflict: 'This Idempotency-Key was already used with a different request body.',
  idempotency_in_flight: 'A request with this Idempotency-Key is still in flight. Retry shortly.',
  rate_limit_exceeded: 'Rate limit exceeded for this Polotno Studio project.',
  template_archived: 'This template is archived and cannot be rendered.',
  unknown_dynamic_field: 'The template has no dynamic field with that name.',
};

export function toFriendlyMessage(status: number, body: unknown): string {
  const env = readEnvelope(body);
  if (!env) return `Polotno Studio API error (HTTP ${status}).`;
  const base = FRIENDLY[env.code] ?? env.message;
  const param = env.param ? ` (field: ${env.param})` : '';
  const rid = env.request_id ? ` [request ${env.request_id}]` : '';
  return `${base}${param}${rid}`;
}

export function toFriendlyError(err: unknown): Error {
  if (err instanceof HttpError) {
    return new Error(toFriendlyMessage(err.response.status, err.response.body));
  }
  return err instanceof Error ? err : new Error(String(err));
}
