import { describe, expect, it } from 'vitest';
import { HttpError } from '@activepieces/pieces-common';
import { toFriendlyError, toFriendlyMessage } from '../errors';

const envelope = (code: string, message: string, extra: Record<string, unknown> = {}) => ({
  error: { type: 'invalid_request_error', code, message, ...extra },
});

describe('toFriendlyMessage', () => {
  it('maps a known code to its friendly text', () => {
    expect(toFriendlyMessage(401, envelope('invalid_api_key', 'Bad key'))).toContain('Invalid API key');
  });

  it('falls back to the API message for an unknown code', () => {
    expect(toFriendlyMessage(400, envelope('weird_code', 'Something specific'))).toContain('Something specific');
  });

  it('appends param and request id when present', () => {
    const msg = toFriendlyMessage(400, envelope('weird_code', 'Nope', { param: 'format', request_id: 'req_1' }));
    expect(msg).toContain('(field: format)');
    expect(msg).toContain('[request req_1]');
  });

  it('degrades gracefully when the body is not an envelope', () => {
    expect(toFriendlyMessage(500, 'gateway exploded')).toBe('Polotno Studio API error (HTTP 500).');
  });
});

describe('toFriendlyError', () => {
  it('unwraps an HttpError into a friendly Error', () => {
    const httpError = new HttpError({}, { status: 402, responseBody: envelope('subscription_inactive', 'x') });
    expect(toFriendlyError(httpError).message).toContain('subscription is not active');
  });

  it('passes a non-HTTP error through untouched', () => {
    const original = new Error('socket hang up');
    expect(toFriendlyError(original)).toBe(original);
  });
});
