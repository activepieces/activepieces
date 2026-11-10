import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { slack } from '../src/index';

const SECRET = 'slack-signing-secret';

function signedRequest({ ageSeconds, secret }: { ageSeconds: number; secret: string }) {
  const rawBody = JSON.stringify({ type: 'event_callback', team_id: 'T0', event: { type: 'message' } });
  const timestamp = String(Math.floor(Date.now() / 1000) - ageSeconds);
  const signature = 'v0=' + createHmac('sha256', secret).update(`v0:${timestamp}:${rawBody}`).digest('hex');
  const headers: Record<string, string> = { 'x-slack-request-timestamp': timestamp, 'x-slack-signature': signature };
  return {
    method: 'POST',
    headers,
    body: JSON.parse(rawBody),
    rawBody,
    queryParams: {},
  };
}

function verify(payload: ReturnType<typeof signedRequest>) {
  return slack.events?.verify({ webhookSecret: SECRET, payload, appWebhookUrl: '' });
}

describe('slack events.verify', () => {
  it('accepts a fresh, correctly signed request', () => {
    expect(verify(signedRequest({ ageSeconds: 0, secret: SECRET }))).toBe(true);
  });

  it.each([3600, 7 * 24 * 3600, -3600])('rejects a correctly signed request %i seconds old', (ageSeconds) => {
    expect(verify(signedRequest({ ageSeconds, secret: SECRET }))).toBe(false);
  });

  it('rejects a request signed with another secret', () => {
    expect(verify(signedRequest({ ageSeconds: 0, secret: 'other' }))).toBe(false);
  });

  it('rejects a request without a timestamp header', () => {
    const payload = signedRequest({ ageSeconds: 0, secret: SECRET });
    expect(verify({ ...payload, headers: { 'x-slack-signature': payload.headers['x-slack-signature'] } })).toBe(false);
  });
});
