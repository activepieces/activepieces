import { HttpError } from '@activepieces/pieces-common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BufferApiError, bufferClient } from '../src/lib/common/client';
import { bufferAuth } from '../src/lib/common/auth';

const sendRequest = vi.fn();

vi.mock('@activepieces/pieces-common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@activepieces/pieces-common')>();
  return {
    ...actual,
    httpClient: {
      sendRequest: (...args: unknown[]) => sendRequest(...args),
    },
  };
});

function ok({ body }: { body: unknown }) {
  return { status: 200, headers: {}, body };
}

function httpError({ status, body }: { status: number; body: unknown }) {
  return new HttpError('[redacted]', { status, responseBody: body });
}

async function caught({ promise }: { promise: Promise<unknown> }): Promise<unknown> {
  try {
    await promise;
  } catch (error) {
    return error;
  }
  throw new Error('expected the call to fail');
}

function query({ token }: { token: string }) {
  return bufferClient.graphql<{ account: { id: string } }>({
    accessToken: token,
    query: 'query { account { id } }',
    operation: 'load your account',
  });
}

function validate({ auth }: { auth: string }) {
  return bufferAuth.validate?.({
    auth,
    server: { apiUrl: 'http://localhost:3000', publicUrl: 'http://localhost:4200', mintOidcToken: async () => 'x' },
  });
}

beforeEach(() => {
  sendRequest.mockReset();
});

describe('bufferClient.graphql', () => {
  it('posts query and variables with a trimmed bearer key, a verifying TLS dispatcher, no retries and a redacted body', async () => {
    sendRequest.mockResolvedValueOnce(ok({ body: { data: { account: { id: 'acc' } } } }));
    await bufferClient.graphql({ accessToken: '  key-1 ', query: 'query Q($a: ID!) { x(a: $a) }', variables: { a: '1' } });
    const [request, options] = sendRequest.mock.calls[0];
    expect(request.method).toBe('POST');
    expect(request.url).toBe('https://api.buffer.com');
    expect(request.headers.Authorization).toBe('Bearer key-1');
    expect(request.body).toEqual({ query: 'query Q($a: ID!) { x(a: $a) }', variables: { a: '1' } });
    expect(request.retries).toBe(0);
    expect(request.redactBodyInErrors).toBe(true);
    expect(options.dispatcher).toBeDefined();
    expect(options.dispatcher.constructor.name).toBe('Agent');
  });

  it('maps the live 401 UNAUTHENTICATED body to a key hint and keeps the vendor body in responseBody, not body', async () => {
    const body = { errors: [{ message: 'Access token is not valid', extensions: { code: 'UNAUTHENTICATED' } }] };
    sendRequest.mockRejectedValueOnce(httpError({ status: 401, body }));
    const error = await caught({ promise: query({ token: 'bad' }) });
    expect(error).toBeInstanceOf(BufferApiError);
    expect(error).toMatchObject({ status: 401, code: 'UNAUTHENTICATED', responseBody: body });
    expect(error).not.toHaveProperty('body');
    expect(String(error)).toContain('HTTP 401 UNAUTHENTICATED): Access token is not valid');
    expect(String(error)).toContain('Settings → API');
  });

  it('reports the rate-limit window from extensions on a 429', async () => {
    sendRequest.mockRejectedValueOnce(httpError({ status: 429, body: { errors: [{ message: 'Too many requests', extensions: { code: 'RATE_LIMIT_EXCEEDED', window: '15m' } }] } }));
    await expect(query({ token: 'k' })).rejects.toThrow('request limit for the 15m window is used up');
  });

  it('throws on 200 with errors[] and null data (live NOT_FOUND shape)', async () => {
    sendRequest.mockResolvedValueOnce(ok({ body: { errors: [{ message: 'Post not found for id: 1', path: ['post'], extensions: { code: 'NOT_FOUND' } }], data: null } }));
    await expect(query({ token: 'k' })).rejects.toThrow('(HTTP 200 NOT_FOUND): Post not found for id: 1');
  });

  it('throws on 200 with a validation error and no data key', async () => {
    sendRequest.mockResolvedValueOnce(ok({ body: { errors: [{ message: 'Cannot query field "idx"', extensions: { code: 'GRAPHQL_VALIDATION_FAILED' } }] } }));
    await expect(query({ token: 'k' })).rejects.toThrow('GRAPHQL_VALIDATION_FAILED');
  });

  it('returns data that arrives with warnings in errors[] when every root field is set, so a saved post is not reported as failed', async () => {
    sendRequest.mockResolvedValueOnce(ok({ body: { data: { account: { id: 'acc' } }, errors: [{ message: 'deprecated field used' }] } }));
    await expect(query({ token: 'k' })).resolves.toEqual({ account: { id: 'acc' } });
  });

  it('throws when a requested root is null even with other data present', async () => {
    sendRequest.mockResolvedValueOnce(ok({ body: { data: { a: { id: 1 }, b: null }, errors: [{ message: 'b failed', extensions: { code: 'FORBIDDEN' } }] } }));
    await expect(bufferClient.graphql({ accessToken: 'k', query: 'q' })).rejects.toThrow('HTTP 200 FORBIDDEN');
  });

  it('refuses an empty key before any request', async () => {
    await expect(query({ token: '   ' })).rejects.toThrow('no API key');
    expect(sendRequest).not.toHaveBeenCalled();
  });

  it('says a timed-out call was not retried', async () => {
    const abort = new Error('aborted');
    abort.name = 'AbortError';
    sendRequest.mockRejectedValueOnce(abort);
    await expect(query({ token: 'k' })).rejects.toThrow('was not retried');
  });
});

describe('auth validate', () => {
  it('accepts a working key', async () => {
    sendRequest.mockResolvedValueOnce(ok({ body: { data: { account: { id: 'acc' } } } }));
    await expect(validate({ auth: 'good' })).resolves.toEqual({ valid: true });
  });

  it('calls a 401 an invalid key', async () => {
    sendRequest.mockRejectedValueOnce(httpError({ status: 401, body: { errors: [{ message: 'Access token is not valid', extensions: { code: 'UNAUTHENTICATED' } }] } }));
    await expect(validate({ auth: 'bad' })).resolves.toMatchObject({ valid: false, error: expect.stringContaining('rejected this API key') });
  });

  it('calls a 429 a rate limit, not an invalid key', async () => {
    sendRequest.mockRejectedValueOnce(httpError({ status: 429, body: { errors: [{ message: 'Too many', extensions: { code: 'RATE_LIMIT_EXCEEDED', window: '24h' } }] } }));
    await expect(validate({ auth: 'k' })).resolves.toMatchObject({ valid: false, error: expect.stringContaining('rate-limited') });
  });

  it('passes other failures through with the vendor message', async () => {
    sendRequest.mockRejectedValueOnce(httpError({ status: 500, body: { errors: [{ message: 'Internal', extensions: { code: 'UNEXPECTED' } }] } }));
    await expect(validate({ auth: 'k' })).resolves.toMatchObject({ valid: false, error: expect.stringContaining('HTTP 500 UNEXPECTED): Internal') });
  });
});

describe('bufferClient.graphql edge cases (QA)', () => {
  it('turns a network failure into a reach error that never contains the API key', async () => {
    sendRequest.mockRejectedValueOnce(new TypeError('fetch failed'));
    const error = await caught({ promise: query({ token: 'secret-key-123' }) });
    expect(String(error)).toContain('could not reach api.buffer.com (fetch failed)');
    expect(String(error)).not.toContain('secret-key-123');
    expect(sendRequest).toHaveBeenCalledTimes(1);
  });

  it('rejects a 200 whose body is not a JSON object instead of returning it', async () => {
    sendRequest.mockResolvedValueOnce(ok({ body: '<html>maintenance</html>' }));
    const error = await caught({ promise: query({ token: 'k' }) });
    expect(error).toBeInstanceOf(BufferApiError);
    expect(String(error)).toContain('(HTTP 200): the response was not a JSON object');
  });

  it('clips a large non-JSON 5xx body in the message and keeps the full body in responseBody', async () => {
    const html = `<html>${'x'.repeat(5000)}</html>`;
    sendRequest.mockRejectedValueOnce(httpError({ status: 502, body: html }));
    const error = await caught({ promise: query({ token: 'k' }) });
    expect(error).toMatchObject({ status: 502, code: undefined, responseBody: html });
    expect(String(error)).toContain('(HTTP 502): <html>');
    expect(String(error).length).toBeLessThan(700);
  });

  it('gives the access hint on a FORBIDDEN code even on HTTP 200', async () => {
    sendRequest.mockResolvedValueOnce(ok({ body: { data: null, errors: [{ message: 'Not allowed', extensions: { code: 'FORBIDDEN' } }] } }));
    await expect(query({ token: 'k' })).rejects.toThrow('has no access to that organization');
  });

  it('treats an empty data object as a failure, not as success', async () => {
    sendRequest.mockResolvedValueOnce(ok({ body: { data: {} } }));
    await expect(query({ token: 'k' })).rejects.toThrow('Buffer could not load your account (HTTP 200).');
  });

  it('reports a network failure in validate with the reason, not as an invalid key', async () => {
    sendRequest.mockRejectedValueOnce(new TypeError('fetch failed'));
    const result = await validate({ auth: 'k' });
    expect(result).toMatchObject({ valid: false, error: expect.stringContaining('could not reach api.buffer.com') });
    expect(result).not.toMatchObject({ error: expect.stringContaining('rejected this API key') });
  });
});
