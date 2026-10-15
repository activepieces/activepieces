import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { HttpMethod } from '@activepieces/pieces-common';
import { DripApiError, dripApi } from '../src/lib/common/client';
import { replies, runStep, stubFetch, TOKEN } from './helpers';

const ACCOUNT = '4617837';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('request', () => {
  test('sends Basic auth with the trimmed token, a User-Agent, JSON body and a fixed Drip origin', async () => {
    const seen = stubFetch(() => ({ body: { ok: 1 } }));
    await runStep(dripApi.request({ token: `  ${TOKEN} `, method: HttpMethod.POST, path: '/1/tags', operation: 'x', body: { a: 1 } }));
    expect(seen[0].url).toBe('https://api.getdrip.com/v2/1/tags');
    expect(seen[0].auth).toBe(`Basic ${Buffer.from(TOKEN).toString('base64')}`);
    expect(seen[0].userAgent).toBe('Activepieces (www.activepieces.com)');
    expect(seen[0].headers.get('content-type')).toContain('application/json');
    expect(seen[0].body).toEqual({ a: 1 });
  });
  test('v3 requests use the same host', async () => {
    const seen = stubFetch(() => ({ status: 202, body: { request_id: 'r' } }));
    await runStep(dripApi.request({ token: TOKEN, method: HttpMethod.POST, version: 'v3', path: '/1/shopper_activity/order', operation: 'x', body: {} }));
    expect(seen[0].url).toBe('https://api.getdrip.com/v3/1/shopper_activity/order');
  });
  test('refuses paths that do not start with a slash, so a lookalike host can never be built', async () => {
    const seen = stubFetch(() => ({ body: {} }));
    await expect(runStep(dripApi.request({ token: TOKEN, method: HttpMethod.GET, path: '.evil.io/x', operation: 'x' }))).rejects.toThrow('must start with');
    expect(seen).toHaveLength(0);
  });
  test('wraps errors in DripApiError with responseBody (never body) and the Drip message', async () => {
    stubFetch(() => ({ status: 422, body: { errors: [{ code: 'presence_error', attribute: 'email', message: 'Email is required' }] } }));
    const error = await runStep(dripApi.request({ token: TOKEN, method: HttpMethod.POST, path: '/1/subscribers', operation: 'create subscriber' })).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(DripApiError);
    expect(String(Reflect.get(Object(error), 'message'))).toContain('Drip create subscriber failed (422 presence_error)');
    expect(String(Reflect.get(Object(error), 'message'))).toContain('email: Email is required');
    expect(Reflect.get(Object(error), 'responseBody')).toEqual({ errors: [{ code: 'presence_error', attribute: 'email', message: 'Email is required' }] });
    expect(Object.keys(Object(error))).not.toContain('body');
  });
  test('explains the disabled-account 403', async () => {
    stubFetch(() => ({ status: 403, body: { errors: [{ code: 'authorization_error', message: 'Your account is disabled.' }] } }));
    await expect(runStep(dripApi.request({ token: TOKEN, method: HttpMethod.GET, path: '/1/tags', operation: 'list tags' }))).rejects.toThrow('account is disabled');
  });
  test('retries 429 twice with bounded waits, then fails', async () => {
    const waits: number[] = [];
    const seen = stubFetch(() => ({ status: 429, body: { message: 'API rate limit exceeded.' } }));
    const wait = async (ms: number) => {
      waits.push(ms);
    };
    await expect(runStep(dripApi.request({ token: TOKEN, method: HttpMethod.GET, path: '/1/tags', operation: 'list tags', wait }))).rejects.toThrow('rate limit');
    expect(seen).toHaveLength(3);
    expect(waits).toEqual([10_000, 15_000]);
  });
  test('a 429 followed by success returns the body', async () => {
    const seen = stubFetch(replies([{ status: 429, body: {} }, { body: { tags: ['a'] } }]));
    await expect(runStep(dripApi.request({ token: TOKEN, method: HttpMethod.GET, path: '/1/tags', operation: 'x' }))).resolves.toEqual({ tags: ['a'] });
    expect(seen).toHaveLength(2);
  });
});

describe('inputs', () => {
  test('seg encodes emails and rejects empty and dot segments', () => {
    expect(dripApi.seg({ value: ' a+b@x.com ', label: 'S' })).toBe('a%2Bb%40x.com');
    expect(dripApi.seg({ value: 'a/b', label: 'S' })).toBe('a%2Fb');
    expect(() => dripApi.seg({ value: '', label: 'S' })).toThrow('S is required');
    expect(() => dripApi.seg({ value: '..', label: 'S' })).toThrow('not valid');
  });
  test('account IDs must be digits', () => {
    expect(dripApi.accountPath(ACCOUNT)).toBe(`/${ACCOUNT}`);
    expect(() => dripApi.accountPath('12/../x')).toThrow('not a valid Drip account ID');
    expect(() => dripApi.parseNumericId({ value: '12a', label: 'Campaign ID' })).toThrow('Campaign ID');
  });
  test('identify picks email or id', () => {
    expect(dripApi.identify({ value: 'a@b.co', label: 'S' })).toEqual({ email: 'a@b.co' });
    expect(dripApi.identify({ value: 'z1tog', label: 'S' })).toEqual({ id: 'z1tog' });
  });
  test('dates, numbers, objects and paging are validated', () => {
    expect(dripApi.parseIsoDate({ value: '2026-01-31T09:00:00.000Z', label: 'D' })).toBe('2026-01-31T09:00:00Z');
    expect(dripApi.parseIsoDate({ value: '', label: 'D' })).toBeUndefined();
    expect(() => dripApi.parseIsoDate({ value: 'yesterday', label: 'D' })).toThrow('ISO-8601');
    expect(dripApi.validateInteger({ value: '5', label: 'N', min: 0, max: 10 })).toBe(5);
    expect(() => dripApi.validateInteger({ value: 1.5, label: 'N', min: 0, max: 10 })).toThrow('whole number');
    expect(dripApi.parseObject({ value: '{"a":1}', label: 'O' })).toEqual({ a: 1 });
    expect(() => dripApi.parseObject({ value: '[1]', label: 'O' })).toThrow('object');
    expect(dripApi.paging({ page: undefined, perPage: undefined, max: 100 })).toEqual({ page: 1, perPage: 100 });
    expect(() => dripApi.paging({ page: 0, perPage: 5, max: 100 })).toThrow('Page');
    expect(() => dripApi.paging({ page: 1, perPage: 101, max: 100 })).toThrow('between 1 and 100');
    expect(dripApi.textList(['a', ' a ', '', 'b'])).toEqual(['a', 'b']);
  });
  test('pageInfo uses total_pages, else a full page means there may be more', () => {
    expect(dripApi.pageInfo({ meta: { total_pages: 3, total_count: 250 }, page: 1, perPage: 100, count: 100 })).toEqual({ page: 1, totalPages: 3, totalCount: 250, hasMore: true });
    expect(dripApi.pageInfo({ meta: { total_pages: 1, total_count: 3 }, page: 1, perPage: 100, count: 3 })).toEqual({ page: 1, totalPages: 1, totalCount: 3, hasMore: false });
    expect(dripApi.pageInfo({ meta: { page: 2 }, page: 2, perPage: 5, count: 5 })).toEqual({ page: 2, totalPages: null, totalCount: null, hasMore: true });
  });
});

describe('resolveAccountId', () => {
  test('uses the given ID without a request', async () => {
    const seen = stubFetch(() => ({ body: {} }));
    await expect(runStep(dripApi.resolveAccountId({ token: TOKEN, accountId: ` ${ACCOUNT} ` }))).resolves.toBe(ACCOUNT);
    expect(seen).toHaveLength(0);
  });
  test('falls back to the only account', async () => {
    stubFetch(() => ({ body: { accounts: [{ id: ACCOUNT, name: 'a' }] } }));
    await expect(runStep(dripApi.resolveAccountId({ token: TOKEN, accountId: undefined }))).resolves.toBe(ACCOUNT);
  });
  test('fails with the choices when there are several accounts, and when there are none', async () => {
    stubFetch(() => ({ body: { accounts: [{ id: '1', name: 'One' }, { id: '2', name: 'Two' }] } }));
    await expect(runStep(dripApi.resolveAccountId({ token: TOKEN, accountId: '' }))).rejects.toThrow('1: One, 2: Two');
    vi.unstubAllGlobals();
    stubFetch(() => ({ body: { accounts: [] } }));
    await expect(runStep(dripApi.resolveAccountId({ token: TOKEN, accountId: '' }))).rejects.toThrow('no accounts');
  });
});
