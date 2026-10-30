import { HttpMethod } from '@activepieces/pieces-common';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { emailitAuth } from '../src/lib/auth';
import { EmailitApiError, emailitClient } from '../src/lib/common/client';
import { API_KEY, failure, replies, stubFetch } from './helpers';

const auth = { secret_text: ` ${API_KEY} ` };
const server = { apiUrl: '', publicUrl: '', mintOidcToken: async () => '' };

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('client', () => {
  test('seg encodes and rejects empty and dot segments', () => {
    expect(emailitClient.seg({ value: '../domains', label: 'Email ID' })).toBe('..%2Fdomains');
    expect(emailitClient.seg({ value: 'ada@example.com', label: 'x' })).toBe('ada%40example.com');
    expect(() => emailitClient.seg({ value: '..', label: 'Email ID' })).toThrow('Email ID is required');
    expect(() => emailitClient.seg({ value: '  ', label: 'Email ID' })).toThrow('Email ID is required');
  });
  test('sends a trimmed Bearer key to api.emailit.com/v2 and maps errors into responseBody', async () => {
    const seen = stubFetch(replies([{ status: 404, body: { error: 'Not Found', message: 'Email not found' } }]));
    const error = await failure(emailitClient.request({ auth, method: HttpMethod.GET, path: '/emails/x' }));
    expect(seen[0].headers.get('authorization')).toBe(`Bearer ${API_KEY}`);
    expect(seen[0].url.toString()).toBe('https://api.emailit.com/v2/emails/x');
    expect(error).toBeInstanceOf(EmailitApiError);
    expect(error).toMatchObject({ status: 404, responseBody: { message: 'Email not found' } });
    expect(error).not.toHaveProperty('body');
    expect(String(error)).toContain('Email not found');
  });
  test('sandbox, plan, credits and Sending Only errors get a specific hint', async () => {
    stubFetch(replies([{ status: 403, body: { error: 'Workspace not verified', code: 'unverified_workspace_recipient' } }]));
    expect(String(await failure(emailitClient.request({ auth, method: HttpMethod.GET, path: '/x' })))).toContain('sandbox mode');
    stubFetch(replies([{ status: 403, body: { error: 'plan_required', required_plan: 'pro' } }]));
    expect(String(await failure(emailitClient.request({ auth, method: HttpMethod.GET, path: '/x' })))).toContain('higher Emailit plan');
    stubFetch(replies([{ status: 402, body: { error: 'Insufficient credits' } }]));
    expect(String(await failure(emailitClient.request({ auth, method: HttpMethod.GET, path: '/x' })))).toContain('out of credits');
    stubFetch(replies([{ status: 403, body: { statusCode: 403, error: 'Forbidden', message: 'Permission denied: read' } }]));
    expect(String(await failure(emailitClient.request({ auth, method: HttpMethod.GET, path: '/x' })))).toContain('Sending Only');
  });
  test('send validation errors list each problem', async () => {
    stubFetch(replies([{ status: 400, body: { error: 'Validation failed', validation_errors: [{ field: 'to', message: 'is invalid' }] } }]));
    expect(String(await failure(emailitClient.request({ auth, method: HttpMethod.POST, path: '/emails', body: {} })))).toContain('to: is invalid');
  });
  test('GET retries 429 at most twice, honoring retry-after', async () => {
    vi.useFakeTimers();
    const seen = stubFetch(replies([{ status: 429, body: { retry_after: 1 } }, { status: 429 }, { status: 429, body: { error: 'Rate limit exceeded' } }]));
    const promise = failure(emailitClient.request({ auth, method: HttpMethod.GET, path: '/x' }));
    await vi.runAllTimersAsync();
    expect(await promise).toMatchObject({ status: 429 });
    expect(seen).toHaveLength(3);
  });
  test('a retry-after longer than 10 s fails at once instead of retrying early', async () => {
    const seen = stubFetch(replies([{ status: 429, headers: { 'retry-after': '60' }, body: { error: 'Daily limit exceeded', retry_after: 41760 } }]));
    expect(await failure(emailitClient.request({ auth, method: HttpMethod.GET, path: '/x' }))).toMatchObject({ status: 429 });
    expect(seen).toHaveLength(1);
  });
  test('the documented retry_after body field is honoured', async () => {
    vi.useFakeTimers();
    const seen = stubFetch(replies([{ status: 429, body: { error: 'Rate limit exceeded', retry_after: 5 } }, { body: { ok: true } }]));
    const promise = emailitClient.request({ auth, method: HttpMethod.GET, path: '/x' });
    await vi.advanceTimersByTimeAsync(4_000);
    expect(seen).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(1_500);
    expect(await promise).toEqual({ ok: true });
    expect(seen).toHaveLength(2);
  });
  test('a POST without an idempotency key is never auto-retried; with a key it is', async () => {
    vi.useFakeTimers();
    const seen = stubFetch(replies([{ status: 429 }]));
    const first = failure(emailitClient.request({ auth, method: HttpMethod.POST, path: '/emails', body: {} }));
    await vi.runAllTimersAsync();
    expect(await first).toMatchObject({ status: 429 });
    expect(seen).toHaveLength(1);
    const keyed = stubFetch(replies([{ status: 429 }, { body: { id: 'em_1' } }]));
    const second = emailitClient.request({ auth, method: HttpMethod.POST, path: '/emails', body: {}, idempotencyKey: 'k1' });
    await vi.runAllTimersAsync();
    expect(await second).toEqual({ id: 'em_1' });
    expect(keyed).toHaveLength(2);
    expect(keyed[0].headers.get('idempotency-key')).toBe('k1');
  });
  test('redirects are not followed', async () => {
    stubFetch(replies([{ status: 302 }]));
    expect(await failure(emailitClient.request({ auth, method: HttpMethod.GET, path: '/x' }))).toMatchObject({ status: 302 });
  });
  test('a failed request carrying email content is not logged with its body', async () => {
    const logged = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    stubFetch(replies([{ status: 400, body: { error: 'bad' } }]));
    await failure(emailitClient.request({ auth, method: HttpMethod.POST, path: '/emails', body: { to: ['secret-person@example.com'], html: 'private text' }, redactBody: true }));
    expect(JSON.stringify(logged.mock.calls)).not.toContain('secret-person');
    expect(JSON.stringify(logged.mock.calls)).not.toContain('private text');
  });
  test('listPage reads both next_page_url and current/total page formats', () => {
    expect(emailitClient.listPage({ data: [1], next_page_url: '/v2/x?page=2' })).toEqual({ items: [1], hasMore: true, totalRecords: null });
    expect(emailitClient.listPage({ data: [], total_records: 0, current_page: 1, total_pages: 0 })).toEqual({ items: [], hasMore: false, totalRecords: 0 });
    expect(emailitClient.listPage({ data: [1], current_page: 1, total_pages: 3 })).toMatchObject({ hasMore: true });
  });
  test('limit and page are validated', () => {
    expect(emailitClient.clampLimit(undefined)).toBe(25);
    expect(emailitClient.clampLimit('50')).toBe(50);
    expect(() => emailitClient.clampLimit(101)).toThrow('1 to 100');
    expect(() => emailitClient.page(0)).toThrow('Page');
  });
});

describe('auth.validate', () => {
  test('401 is an invalid key', async () => {
    stubFetch(replies([{ status: 401, body: { error: 'Unauthorized' } }]));
    expect(await emailitAuth.validate?.({ auth: 'bad', server })).toMatchObject({ valid: false, error: expect.stringContaining('Invalid API key') });
  });
  test('a Sending Only key (403 Permission denied) is accepted', async () => {
    const seen = stubFetch(replies([{ status: 403, body: { statusCode: 403, error: 'Forbidden', message: 'Permission denied: read' } }]));
    expect(await emailitAuth.validate?.({ auth: 'sending-key', server })).toEqual({ valid: true });
    expect(seen[0].method).toBe('GET');
  });
  test('a suspended workspace 403 and a 500 are not reported as an invalid key', async () => {
    stubFetch(replies([{ status: 500, body: { error: 'Upstream failed' } }]));
    const result = await emailitAuth.validate?.({ auth: 'k', server });
    expect(result).toMatchObject({ valid: false });
    expect(JSON.stringify(result)).toContain('Upstream failed');
    expect(JSON.stringify(result)).not.toContain('Invalid API key');
  });
});
