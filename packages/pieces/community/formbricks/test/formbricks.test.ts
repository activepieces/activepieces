import { createHmac, randomBytes } from 'crypto';
import { describe, expect, it, vi } from 'vitest';
import { buildFormbricksError, buildFormbricksUrl, normalizeAppUrl, toFormbricksError } from '../src/lib/common/client';
import { handleFormbricksWebhook, readStoredWebhook, verifyStandardWebhook } from '../src/lib/common/webhook';
import { formbricksInputs } from '../src/lib/common/inputs';
import { collectPages, collectSampleResponses, FormbricksResponse } from '../src/lib/common/api';

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
    keys: () => [...data.keys()],
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

  it('still drops a replay after 1,000 newer deliveries inside the signature window', async () => {
    const store = memoryStore({ key: { webhookId: 'wh1', secret: SECRET } });
    const first = delivery({ event: 'responseFinished', id: 'msg_old', timestamp });
    expect(await handleFormbricksWebhook({ payload: first, store, storeKey: 'key', eventType: 'responseFinished', nowMs: NOW_MS })).toHaveLength(1);
    for (let i = 0; i < 1000; i++) {
      const next = delivery({ event: 'responseFinished', id: `msg_${i}`, timestamp });
      await handleFormbricksWebhook({ payload: next, store, storeKey: 'key', eventType: 'responseFinished', nowMs: NOW_MS });
    }
    const replayAt = NOW_MS + 14 * 60 * 1000;
    expect(await handleFormbricksWebhook({ payload: first, store, storeKey: 'key', eventType: 'responseFinished', nowMs: replayAt })).toEqual([]);
  });

  it('reuses a fixed set of slots, so old delivery IDs are overwritten instead of piling up', async () => {
    const store = memoryStore({ key: { webhookId: 'wh1', secret: SECRET } });
    for (let i = 0; i < 3000; i++) {
      const next = delivery({ event: 'responseFinished', id: `msg_${i}`, timestamp: timestamp - (i % 900) });
      await handleFormbricksWebhook({ payload: next, store, storeKey: 'key', eventType: 'responseFinished', nowMs: NOW_MS });
    }
    expect(store.keys().length).toBeLessThanOrEqual(1 + 1260);
    const later = NOW_MS + 1260 * 1000;
    const reused = delivery({ event: 'responseFinished', id: 'msg_reused', timestamp: timestamp + 1260 });
    expect(await handleFormbricksWebhook({ payload: reused, store, storeKey: 'key', eventType: 'responseFinished', nowMs: later })).toHaveLength(1);
    expect(store.keys().length).toBeLessThanOrEqual(1 + 1260);
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

describe('collectPages', () => {
  it('reports hitCap when the scan stops with full pages left', async () => {
    const fetchPage = vi.fn(async () => Array.from({ length: 10 }, (_, i) => i));
    const result = await collectPages({ fetchPage, pageSize: 10, maxItems: 30 });
    expect(result.items).toHaveLength(30);
    expect(result.hitCap).toBe(true);
    expect(fetchPage).toHaveBeenCalledTimes(3);
  });

  it('does not report hitCap when the last page is short', async () => {
    const pages = [[1, 2, 3], [4]];
    const result = await collectPages({ fetchPage: async (offset) => pages[offset / 3] ?? [], pageSize: 3, maxItems: 30 });
    expect(result).toEqual({ items: [1, 2, 3, 4], hitCap: false });
  });
});

describe('collectSampleResponses', () => {
  const response = ({ id, surveyId, createdAt, finished = true }: { id: string; surveyId: string; createdAt: string; finished?: boolean }): FormbricksResponse => ({
    id,
    surveyId,
    finished,
    data: {},
    variables: {},
    contactId: null,
    contactAttributes: null,
    meta: {},
    language: null,
    endingId: null,
    singleUseId: null,
    createdAt,
    updatedAt: createdAt,
  });

  it('queries every selected survey and merges newest first', async () => {
    const bySurvey: Record<string, FormbricksResponse[]> = {
      s1: [response({ id: 'r1', surveyId: 's1', createdAt: '2026-10-01T00:00:00Z' })],
      s2: [response({ id: 'r2', surveyId: 's2', createdAt: '2026-10-03T00:00:00Z' }), response({ id: 'x', surveyId: 'other', createdAt: '2026-10-09T00:00:00Z' })],
      s3: [response({ id: 'r3', surveyId: 's3', createdAt: '2026-10-02T00:00:00Z', finished: false })],
    };
    const fetchSurveyResponses = vi.fn(async (id: string) => bySurvey[id] ?? []);
    const result = await collectSampleResponses({ surveyIds: ['s1', 's2', 's3'], finishedOnly: false, sampleSize: 5, fetchSurveyResponses });
    expect(fetchSurveyResponses).toHaveBeenCalledTimes(3);
    expect(result.map((r) => r.id)).toEqual(['r2', 'r3', 'r1']);
  });

  it('applies finishedOnly and the sample size', async () => {
    const result = await collectSampleResponses({
      surveyIds: ['s1'],
      finishedOnly: true,
      sampleSize: 1,
      fetchSurveyResponses: async () => [
        response({ id: 'a', surveyId: 's1', createdAt: '2026-10-05T00:00:00Z', finished: false }),
        response({ id: 'b', surveyId: 's1', createdAt: '2026-10-04T00:00:00Z' }),
        response({ id: 'c', surveyId: 's1', createdAt: '2026-10-03T00:00:00Z' }),
      ],
    });
    expect(result.map((r) => r.id)).toEqual(['b']);
  });

  it('returns nothing when the workspace has no surveys', async () => {
    const fetchSurveyResponses = vi.fn();
    expect(await collectSampleResponses({ surveyIds: [], finishedOnly: false, sampleSize: 5, fetchSurveyResponses })).toEqual([]);
    expect(fetchSurveyResponses).not.toHaveBeenCalled();
  });
});
