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

function parse(payload: ReturnType<typeof signedRequest>) {
  return slack.events?.parseAndReply({ payload, server: { publicUrl: 'https://example.com/' } });
}

function verify(payload: ReturnType<typeof signedRequest>) {
  return slack.events?.verify({ webhookSecret: SECRET, payload, appWebhookUrl: '' });
}

describe('slack events.verify', () => {
  it('accepts a fresh, correctly signed request', () => {
    expect(verify(signedRequest({ ageSeconds: 0, secret: SECRET }))).toBe(true);
  });

  it('rejects a request signed with another secret', () => {
    expect(verify(signedRequest({ ageSeconds: 0, secret: 'other' }))).toBe(false);
  });

  it('rejects a request without a timestamp header', () => {
    const payload = signedRequest({ ageSeconds: 0, secret: SECRET });
    expect(verify({ ...payload, headers: { 'x-slack-signature': payload.headers['x-slack-signature'] } })).toBe(false);
  });
});

describe('slack events.parseAndReply request age', () => {
  it('routes a fresh request', () => {
    expect(parse(signedRequest({ ageSeconds: 0, secret: SECRET }))).toEqual({ event: 'message', identifierValue: 'T0' });
  });

  it.each([3600, 7 * 24 * 3600, -3600])('drops a correctly signed request %i seconds old when it arrives', (ageSeconds) => {
    const result = parse(signedRequest({ ageSeconds, secret: SECRET }));
    expect(result?.event).toBeUndefined();
    expect(result?.reply).toBeDefined();
  });

  it('drops a request without a timestamp header', () => {
    const payload = signedRequest({ ageSeconds: 0, secret: SECRET });
    expect(parse({ ...payload, headers: { 'x-slack-signature': payload.headers['x-slack-signature'] } })?.event).toBeUndefined();
  });

  it('still verifies a request that arrived on time but runs later', () => {
    expect(verify(signedRequest({ ageSeconds: 3600, secret: SECRET }))).toBe(true);
  });
});
