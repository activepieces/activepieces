import { httpClient, HttpError, HttpMethod, HttpRequest } from '@activepieces/pieces-common';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { firefliesClient, FirefliesApiError } from '../src/lib/common/client';

afterEach(() => vi.restoreAllMocks());

describe('firefliesClient.graphql', () => {
  test('sends a bearer POST through httpClient with a verified-TLS dispatcher, no redirect following and a redacted body', async () => {
    const seen = mockHttpClient({ replies: [{ body: { data: { user: { user_id: 'u1' } } } }] });
    const data = await firefliesClient.graphql({ apiKey: { type: 'SECRET_TEXT', secret_text: ' key-123 ' }, query: 'query { user { user_id } }', operation: 'test' });
    expect(data).toEqual({ user: { user_id: 'u1' } });
    expect(seen).toHaveLength(1);
    expect(seen[0].request).toMatchObject({
      method: HttpMethod.POST,
      url: 'https://api.fireflies.ai/graphql',
      headers: { Authorization: 'Bearer key-123', Accept: 'application/json' },
      body: { query: 'query { user { user_id } }', variables: {} },
      followRedirects: false,
      redactBodyInErrors: true,
      timeout: 60_000,
    });
    expect(seen[0].hasDispatcher).toBe(true);
  });

  test('passes the caller timeout, capped at 60 s', async () => {
    const seen = mockHttpClient({ replies: [{ body: { data: {} } }, { body: { data: {} } }] });
    await firefliesClient.graphql({ apiKey: 'k', query: 'q', operation: 'x', timeoutMs: 12_000 });
    await firefliesClient.graphql({ apiKey: 'k', query: 'q', operation: 'x', timeoutMs: 999_000 });
    expect(seen.map((entry) => entry.request.timeout)).toEqual([12_000, 60_000]);
  });

  test('a 200 response with errors[] throws with the vendor code and message, never the request body', async () => {
    mockHttpClient({
      replies: [
        {
          body: {
            data: null,
            errors: [{ message: 'Meeting not found', code: 'object_not_found', extensions: { code: 'object_not_found', status: 404 } }],
          },
        },
      ],
    });
    const failure = await firefliesClient
      .graphql({ apiKey: 'k', query: 'query', variables: { secretVariable: 'DO-NOT-LEAK' }, operation: 'get meeting' })
      .catch((error: unknown) => error);
    expect(failure).toBeInstanceOf(FirefliesApiError);
    const message = failure instanceof Error ? failure.message : '';
    expect(message).toContain('HTTP 200');
    expect(message).toContain('code object_not_found');
    expect(message).toContain('vendor status 404');
    expect(message).toContain('Meeting not found');
    expect(message).not.toContain('DO-NOT-LEAK');
  });

  test('invalid_arguments includes the per-field messages from the metadata', async () => {
    mockHttpClient({
      replies: [
        {
          body: {
            data: { transcripts: null },
            errors: [
              {
                message: 'Invalid argument(s) were provided',
                code: 'invalid_arguments',
                extensions: { code: 'invalid_arguments', status: 400, metadata: { fields: [{ name: 'userId', message: 'Only one of the following fields can be provided: mine, userId.' }] } },
              },
            ],
          },
        },
      ],
    });
    await expect(firefliesClient.graphql({ apiKey: 'k', query: 'q', operation: 'search meetings' })).rejects.toThrow(
      'Fireflies said "Invalid argument(s) were provided: Only one of the following fields can be provided: mine, userId.".',
    );
  });

  test('an httpClient HttpError (non-2xx) maps to FirefliesApiError with status, code and field reasons, without the request body', async () => {
    mockHttpClient({
      replies: [
        {
          error: new HttpError('[redacted]', {
            status: 400,
            responseBody: {
              errors: [{ message: 'Invalid argument(s) were provided', code: 'invalid_arguments', extensions: { status: 400, metadata: { fields: [{ message: 'limit must be at most 50' }] } } }],
            },
          }),
        },
      ],
    });
    const failure = await firefliesClient.graphql({ apiKey: 'k', query: 'q', variables: { secret: 'DO-NOT-LEAK' }, operation: 'search meetings' }).catch((error: unknown) => error);
    expect(failure).toBeInstanceOf(FirefliesApiError);
    expect(failure instanceof FirefliesApiError ? failure.status : 0).toBe(400);
    expect(failure instanceof FirefliesApiError ? failure.code : '').toBe('invalid_arguments');
    const message = failure instanceof Error ? failure.message : '';
    expect(message).toContain('HTTP 400');
    expect(message).toContain('limit must be at most 50');
    expect(message).not.toContain('DO-NOT-LEAK');
  });

  test('a non-2xx response throws with its status even without errors[]', async () => {
    mockHttpClient({ replies: [{ error: new HttpError('[redacted]', { status: 500, responseBody: 'upstream exploded' }) }] });
    await expect(firefliesClient.graphql({ apiKey: 'k', query: 'q', operation: 'list users' })).rejects.toThrow('Fireflies list users failed (HTTP 500): Fireflies said "upstream exploded"');
  });

  test('too_many_requests carries retryAfter from the metadata on a 429, or from the Retry-After header on a 2xx', async () => {
    mockHttpClient({
      replies: [{ error: new HttpError('[redacted]', { status: 429, responseBody: { errors: [{ message: 'Too many', code: 'too_many_requests', extensions: { metadata: { retryAfter: 1700000000000 } } }] } }) }],
    });
    const failure = await firefliesClient.graphql({ apiKey: 'k', query: 'q', operation: 'x' }).catch((error: unknown) => error);
    expect(failure instanceof Error ? failure.message : '').toContain('Retry after 1700000000000');
    expect(failure instanceof FirefliesApiError ? failure.retryAfter : '').toBe('1700000000000');
    mockHttpClient({ replies: [{ body: { data: null, errors: [{ message: 'Too many', code: 'too_many_requests' }] }, headers: { 'retry-after': '30' } }] });
    await expect(firefliesClient.graphql({ apiKey: 'k', query: 'q', operation: 'x' })).rejects.toThrow('Retry after 30');
  });

  test('a redirect is refused, not followed', async () => {
    mockHttpClient({ replies: [{ status: 302, body: {} }] });
    await expect(firefliesClient.graphql({ apiKey: 'k', query: 'q', operation: 'x' })).rejects.toThrow('redirect');
  });

  test('a timeout and a network failure get their own messages', async () => {
    const abort = new Error('This operation was aborted');
    abort.name = 'AbortError';
    mockHttpClient({ replies: [{ error: abort }] });
    await expect(firefliesClient.graphql({ apiKey: 'k', query: 'q', operation: 'x', timeoutMs: 5_000 })).rejects.toThrow('timed out after 5 s');
    mockHttpClient({ replies: [{ error: new Error('getaddrinfo ENOTFOUND') }] });
    await expect(firefliesClient.graphql({ apiKey: 'k', query: 'q', operation: 'x' })).rejects.toThrow('could not reach the Fireflies API: getaddrinfo ENOTFOUND');
  });

  test('an empty key fails before any request', async () => {
    const seen = mockHttpClient({ replies: [{ body: { data: {} } }] });
    await expect(firefliesClient.graphql({ apiKey: '  ', query: 'q', operation: 'x' })).rejects.toThrow('API key is empty');
    expect(seen).toHaveLength(0);
  });

  test('a response with no data object throws', async () => {
    mockHttpClient({ replies: [{ body: { data: null } }] });
    await expect(firefliesClient.graphql({ apiKey: 'k', query: 'q', operation: 'x' })).rejects.toThrow('no data object');
  });
});

describe('firefliesClient.requireEntity', () => {
  test('a null root entity throws the caller message instead of returning null', () => {
    expect(() => firefliesClient.requireEntity({ data: { transcript: null }, key: 'transcript', notFound: 'not found here' })).toThrow('not found here');
    expect(firefliesClient.requireEntity({ data: { transcript: { id: 'a' } }, key: 'transcript', notFound: 'x' })).toEqual({ id: 'a' });
  });
});

function mockHttpClient({ replies }: { replies: FakeReply[] }): SeenCall[] {
  const seen: SeenCall[] = [];
  vi.spyOn(httpClient, 'sendRequest').mockImplementation(async (request: HttpRequest, options?: { dispatcher?: unknown }) => {
    seen.push({ request, hasDispatcher: options?.dispatcher !== undefined });
    const reply = replies[Math.min(seen.length - 1, replies.length - 1)];
    if (reply.error) {
      throw reply.error;
    }
    return { status: reply.status ?? 200, headers: reply.headers ?? {}, body: reply.body };
  });
  return seen;
}

type FakeReply = { status?: number; body?: unknown; headers?: Record<string, string>; error?: Error };

type SeenCall = { request: HttpRequest; hasDispatcher: boolean };
