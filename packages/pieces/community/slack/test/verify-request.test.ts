import crypto from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { slack } from '../src/index';

describe('slack events.parseAndReply', () => {
  it('routes a fresh event', () => {
    expect(parse({ ageSeconds: 0 })?.event).toBe('message');
  });

  it.each([3600, 7 * 24 * 3600, -3600])('drops an event sent %i seconds ago', (ageSeconds) => {
    const result = parse({ ageSeconds });
    expect(result?.event).toBeUndefined();
    expect(result?.reply).toBeDefined();
  });

  it('drops an event without a timestamp header', () => {
    const result = slack.events?.parseAndReply({
      payload: { ...slackRequest({ ageSeconds: 0 }), headers: {} },
      server: { publicUrl: '' },
    });
    expect(result?.event).toBeUndefined();
  });
});

function parse({ ageSeconds }: { ageSeconds: number }) {
  return slack.events?.parseAndReply({ payload: slackRequest({ ageSeconds }), server: { publicUrl: '' } });
}

function slackRequest({ ageSeconds }: { ageSeconds: number }) {
  const rawBody = JSON.stringify({ type: 'event_callback', team_id: 'T0', event: { type: 'message' } });
  const timestamp = String(Math.floor(Date.now() / 1000) - ageSeconds);
  const signature = `v0=${crypto.createHmac('sha256', SECRET).update(`v0:${timestamp}:${rawBody}`).digest('hex')}`;
  return {
    method: 'POST',
    headers: { 'x-slack-request-timestamp': timestamp, 'x-slack-signature': signature },
    body: JSON.parse(rawBody),
    rawBody,
    queryParams: {},
  };
}

const SECRET = 'slack-signing-secret';
