import { HttpError } from '@activepieces/pieces-common';

interface ErrorEnvelope {
  type: string;
  code: string;
  message: string;
  param?: string;
  request_id?: string;
}

function readEnvelope(body: unknown): ErrorEnvelope | undefined {
  if (typeof body !== 'object' || body === null) return undefined;
  const err = (body as { error?: unknown }).error;
  if (typeof err !== 'object' || err === null) return undefined;
  const e = err as Record<string, unknown>;
  if (typeof e['code'] !== 'string' || typeof e['message'] !== 'string') return undefined;
  return {
    type: typeof e['type'] === 'string' ? e['type'] : 'api_error',
    code: e['code'],
    message: e['message'],
    param: typeof e['param'] === 'string' ? e['param'] : undefined,
    request_id: typeof e['request_id'] === 'string' ? e['request_id'] : undefined,
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
