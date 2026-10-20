import { createHmac, randomBytes } from 'crypto';
import { describe, expect, it, vi } from 'vitest';
import { buildFormbricksError, buildFormbricksUrl, normalizeAppUrl, toFormbricksError } from '../src/lib/common/client';
import { handleFormbricksWebhook, readStoredWebhook, verifyStandardWebhook } from '../src/lib/common/webhook';
import { formbricksInputs } from '../src/lib/common/inputs';

const SECRET_BYTES = randomBytes(32);
const SECRET = `whsec_${SECRET_BYTES.toString('base64')}`;
const NOW_MS = 1_792_489_000_000;

function sign({ id, timestamp, body }: { id: string; timestamp: number; body: string }): string {
  return `v1,${createHmac('sha256', SECRET_BYTES).update(`${id}.${timestamp}.${body}`).digest('base64')}`;
}

function memoryStore(initial: Record<string, unknown>) {
  const data = new Map<string, unknown>(Object.entries(initial));
  return {
    get: vi.fn(async (key: string) => (data.has(key) ? structuredClone(data.get(key)) : null)),
    put: vi.fn(async (key: string, value: unknown) => {
      data.set(key, value);
      return value;
    }),
  };
}

function delivery({ event, id, timestamp, signature }: { event: string; id: string; timestamp: number; signature?: string }) {
  const body = JSON.stringify({ webhookId: 'wh1', event, data: { id: 'resp1', finished: true, data: { q1: 'yes' } } });
  return {
    body: JSON.parse(body),
    rawBody: body,
    headers: {
      'webhook-id': id,
      'webhook-timestamp': String(timestamp),
      'webhook-signature': signature ?? sign({ id, timestamp, body }),
    },
  };
}

describe('normalizeAppUrl', () => {
  it('strips trailing slashes and api suffixes', () => {
    expect(normalizeAppUrl('https://app.formbricks.com/')).toBe('https://app.formbricks.com');
    expect(normalizeAppUrl('https://app.formbricks.com/api')).toBe('https://app.formbricks.com');
    expect(normalizeAppUrl('https://app.formbricks.com/api/v1/')).toBe('https://app.formbricks.com');
    expect(normalizeAppUrl(' surveys.example.com/forms/api/v2/management ')).toBe('https://surveys.example.com/forms');
  });

  it('keeps http and private hosts for self-hosted servers', () => {
    expect(normalizeAppUrl('http://192.168.1.10:3000')).toBe('http://192.168.1.10:3000');
  });

  it('rejects other schemes and credentials', () => {
    expect(() => normalizeAppUrl('ftp://example.com')).toThrow(/https/);
    expect(() => normalizeAppUrl('file:///etc/passwd')).toThrow(/https/);
    expect(() => normalizeAppUrl('https://user:pw@example.com')).toThrow(/user name/);
    expect(() => normalizeAppUrl('')).toThrow();
  });

  it('builds URLs and refuses path tricks', () => {
    expect(buildFormbricksUrl({ appUrl: 'https://app.formbricks.com/', path: '/api/v2/me', query: { a: 1, b: undefined, c: '' } })).toBe(
      'https://app.formbricks.com/api/v2/me?a=1',
    );
    expect(() => buildFormbricksUrl({ appUrl: 'https://x.io', path: '/api/../admin' })).toThrow();
    expect(() => buildFormbricksUrl({ appUrl: 'https://x.io', path: '//evil.com/x' })).toThrow();
  });
});

describe('errors', () => {
  it('keeps the vendor detail and never exposes a body field', () => {
    const error = buildFormbricksError({ status: 404, responseBody: { error: { code: 404, message: 'Not Found', details: [{ field: 'response', issue: 'not found' }] } } });
    expect(error.message).toContain('HTTP 404');
    expect(error.message).toContain('not found');
    expect(error.status).toBe(404);
    expect(Object.keys(error)).not.toContain('body');
  });

  it('maps httpClient errors by response status', () => {
    const httpError = Object.assign(new Error('x'), { response: { status: 401, body: { error: { message: 'Unauthorized' } } } });
    expect(toFormbricksError(httpError)?.message).toContain('API key');
    expect(toFormbricksError(new Error('plain'))).toBeUndefined();
  });

  it('hides HTML error pages', () => {
    expect(buildFormbricksError({ status: 502, responseBody: '<html>bad gateway</html>' }).message).toBe('Formbricks returned a server error. Retry later (HTTP 502).');
  });
});

describe('verifyStandardWebhook', () => {
  const timestamp = Math.floor(NOW_MS / 1000);
  const body = '{"event":"responseFinished"}';

  it('accepts a valid signature, also among several', () => {
    const signature = sign({ id: 'msg_1', timestamp, body });
    const headers = { 'webhook-id': 'msg_1', 'webhook-timestamp': String(timestamp), 'webhook-signature': `v1,AAAA ${signature}` };
    expect(verifyStandardWebhook({ secret: SECRET, rawBody: body, headers, nowMs: NOW_MS })).toBe(true);
  });

  it('rejects a tampered body, wrong secret or missing headers', () => {
    const headers = { 'webhook-id': 'msg_1', 'webhook-timestamp': String(timestamp), 'webhook-signature': sign({ id: 'msg_1', timestamp, body }) };
    expect(verifyStandardWebhook({ secret: SECRET, rawBody: body + ' ', headers, nowMs: NOW_MS })).toBe(false);
    expect(verifyStandardWebhook({ secret: `whsec_${randomBytes(32).toString('base64')}`, rawBody: body, headers, nowMs: NOW_MS })).toBe(false);
    expect(verifyStandardWebhook({ secret: SECRET, rawBody: body, headers: { 'webhook-id': 'msg_1' }, nowMs: NOW_MS })).toBe(false);
    expect(verifyStandardWebhook({ secret: SECRET, rawBody: undefined, headers, nowMs: NOW_MS })).toBe(false);
  });

  it('allows queue lag up to 15 minutes but not more', () => {
    const late = timestamp - 14 * 60;
    const tooLate = timestamp - 16 * 60;
    const lateHeaders = { 'webhook-id': 'm', 'webhook-timestamp': String(late), 'webhook-signature': sign({ id: 'm', timestamp: late, body }) };
    const tooLateHeaders = { 'webhook-id': 'm', 'webhook-timestamp': String(tooLate), 'webhook-signature': sign({ id: 'm', timestamp: tooLate, body }) };
    expect(verifyStandardWebhook({ secret: SECRET, rawBody: body, headers: lateHeaders, nowMs: NOW_MS })).toBe(true);
    expect(verifyStandardWebhook({ secret: SECRET, rawBody: body, headers: tooLateHeaders, nowMs: NOW_MS })).toBe(false);
  });
});

describe('handleFormbricksWebhook', () => {
  const timestamp = Math.floor(NOW_MS / 1000);

  it('returns a signed delivery once and drops the replay', async () => {
    const store = memoryStore({ key: { webhookId: 'wh1', secret: SECRET } });
    const payload = delivery({ event: 'responseFinished', id: 'msg_1', timestamp });
    const first = await handleFormbricksWebhook({ payload, store, storeKey: 'key', eventType: 'responseFinished', nowMs: NOW_MS });
    const second = await handleFormbricksWebhook({ payload, store, storeKey: 'key', eventType: 'responseFinished', nowMs: NOW_MS });
    expect(first).toHaveLength(1);
    expect(second).toHaveLength(0);
  });

  it('drops a forged delivery when a secret is stored', async () => {
    const store = memoryStore({ key: { webhookId: 'wh1', secret: SECRET } });
    const payload = delivery({ event: 'responseFinished', id: 'msg_2', timestamp, signature: 'v1,Zm9yZ2Vk' });
    expect(await handleFormbricksWebhook({ payload, store, storeKey: 'key', eventType: 'responseFinished', nowMs: NOW_MS })).toEqual([]);
  });

  it('keeps accepting unsigned deliveries for webhooks created before 0.4.0', async () => {
    const store = memoryStore({ key: { data: { id: 'legacy' } } });
    const payload = { body: { webhookId: 'legacy', event: 'responseCreated', data: { id: 'r' } }, headers: {} };
    expect(await handleFormbricksWebhook({ payload, store, storeKey: 'key', eventType: 'responseCreated', nowMs: NOW_MS })).toHaveLength(1);
  });

  it('ignores other events', async () => {
    const store = memoryStore({ key: { webhookId: 'wh1', secret: SECRET } });
    const payload = delivery({ event: 'responseUpdated', id: 'msg_3', timestamp });
    expect(await handleFormbricksWebhook({ payload, store, storeKey: 'key', eventType: 'responseFinished', nowMs: NOW_MS })).toEqual([]);
  });
});

describe('readStoredWebhook', () => {
  it('reads the new and the legacy store shapes', () => {
    expect(readStoredWebhook({ webhookId: 'a', secret: 's' })).toEqual({ webhookId: 'a', secret: 's' });
    expect(readStoredWebhook({ data: { id: 'b' } })).toEqual({ webhookId: 'b', secret: null });
    expect(readStoredWebhook(null)).toEqual({ webhookId: null, secret: null });
  });
});

describe('inputs', () => {
  it('parses answers and attributes', () => {
    expect(formbricksInputs.answers({ value: '{"q1":"a"}', required: true })).toEqual({ q1: 'a' });
    expect(() => formbricksInputs.answers({ value: {}, required: true })).toThrow(/question ID/);
    expect(formbricksInputs.answers({ value: undefined, required: false })).toBeUndefined();
    expect(formbricksInputs.stringRecord({ plan: 'pro', empty: '', n: 3, missing: null })).toEqual({ plan: 'pro', n: '3' });
    expect(formbricksInputs.clampInt({ value: 900, min: 1, max: 250, fallback: 50 })).toBe(250);
    expect(() => formbricksInputs.optionalDate({ value: 'nope', label: 'From' })).toThrow(/From/);
  });
});
