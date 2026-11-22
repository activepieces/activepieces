import { afterEach, describe, expect, test, vi } from 'vitest';
import { SignNowApiError, signNowClient } from '../src/lib/common/client';

function stubFetch({ status, body, fail }: { status?: number; body?: unknown; fail?: Error }): Captured[] {
  const seen: Captured[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string, init: RequestInit & { dispatcher?: unknown }) => {
      seen.push({ url: input, init });
      if (fail !== undefined) {
        throw fail;
      }
      return new Response(typeof body === 'string' ? body : JSON.stringify(body ?? {}), { status: status ?? 200 });
    })
  );
  return seen;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('signNowClient.request', () => {
  test('sends bearer, JSON body and a verifying dispatcher', async () => {
    const seen = stubFetch({ body: { id: 'doc1' } });
    const body = await signNowClient.request({ token: ' TKN ', method: 'POST', path: '/template/t1/copy', operation: 'copy', body: { a: 1 } });
    expect(body).toEqual({ id: 'doc1' });
    expect(seen[0].url).toBe('https://api.signnow.com/template/t1/copy');
    const headers = new Headers(seen[0].init.headers);
    expect(headers.get('authorization')).toBe('Bearer TKN');
    expect(headers.get('content-type')).toBe('application/json');
    expect(seen[0].init.body).toBe('{"a":1}');
    expect(seen[0].init.dispatcher).toBeDefined();
  });

  test('maps errors[] to the vendor message without the request body', async () => {
    stubFetch({ status: 400, body: { errors: [{ code: 65582, message: 'invalid email' }] } });
    const error = await signNowClient
      .request({ token: 'T', method: 'POST', path: '/document/d/invite', operation: 'send invite', body: { secret: 'SECRET-PAYLOAD' } })
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(SignNowApiError);
    expect(String(error)).toContain('SignNow send invite failed (HTTP 400): invalid email - 65582');
    expect(String(error)).not.toContain('SECRET-PAYLOAD');
    expect(JSON.stringify(error)).not.toContain('SECRET-PAYLOAD');
  });

  test('maps a body keyed by status code to its text', async () => {
    stubFetch({ status: 404, body: { '404': 'Unable to find a route to match the URI: document/nope123' } });
    const error = await signNowClient.request({ token: 'T', method: 'GET', path: '/document/nope123', operation: 'get document' }).catch((e: unknown) => e);
    expect(String(error)).toContain('SignNow get document failed (HTTP 404): Unable to find a route to match the URI: document/nope123');
  });

  test('maps {error, code} bodies', async () => {
    stubFetch({ status: 404, body: { error: 'document not found', code: 404 } });
    const error = await signNowClient.request({ token: 'T', method: 'GET', path: '/document/x', operation: 'get document' }).catch((e: unknown) => e);
    expect(signNowClient.isNotFound(error)).toBe(true);
    expect(String(error)).toContain('document not found');
  });

  test('transport failure on POST says it may have been applied', async () => {
    stubFetch({ fail: new TypeError('fetch failed') });
    await expect(signNowClient.request({ token: 'T', method: 'POST', path: '/document', operation: 'upload document' })).rejects.toThrow(
      /SignNow upload document failed: the network request failed\. The request may still have been applied/
    );
  });

  test('transport failure on GET has no applied warning', async () => {
    stubFetch({ fail: new TypeError('fetch failed') });
    const error = await signNowClient.request({ token: 'T', method: 'GET', path: '/user', operation: 'get user' }).catch((e: unknown) => e);
    expect(String(error)).not.toContain('may still have been applied');
  });

  test('empty token is rejected before any call', async () => {
    const seen = stubFetch({ body: {} });
    await expect(signNowClient.request({ token: '  ', method: 'GET', path: '/user', operation: 'get user' })).rejects.toThrow(/empty/);
    expect(seen).toHaveLength(0);
  });
});

describe('signNowClient.uploadDocument', () => {
  test('sends a native multipart FormData with the file and check_fields', async () => {
    const seen = stubFetch({ body: { id: 'new-doc' } });
    const result = await signNowClient.uploadDocument({
      token: 'T',
      file: { filename: 'a.pdf', base64: Buffer.from('%PDF-1.4').toString('base64') },
      checkFields: true,
    });
    expect(result).toEqual({ id: 'new-doc' });
    const form = seen[0].init.body;
    expect(form).toBeInstanceOf(FormData);
    if (!(form instanceof FormData)) {
      return;
    }
    const file = form.get('file');
    expect(file).toBeInstanceOf(Blob);
    expect(form.get('check_fields')).toBe('true');
    expect(new Headers(seen[0].init.headers).get('content-type')).toBeNull();
  });

  test('upload error does not contain the file contents', async () => {
    stubFetch({ status: 422, body: { errors: [{ code: 1, message: 'bad file' }] } });
    const error = await signNowClient
      .uploadDocument({ token: 'T', file: { filename: 'a.pdf', base64: Buffer.from('FILE-BYTES-XYZ').toString('base64') }, checkFields: false })
      .catch((e: unknown) => e);
    expect(String(error)).toContain('bad file');
    expect(String(error)).not.toContain('FILE-BYTES-XYZ');
  });
});

type Captured = { url: string; init: RequestInit & { dispatcher?: unknown } };

describe('preflight: httpClient transport', () => {
  test('failed requests never log the request body', async () => {
    stubFetch({ status: 400, body: { error: 'bad' } });
    const logged: string[] = [];
    vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
      logged.push(args.map((arg) => (arg instanceof Error ? `${arg.message} ${JSON.stringify(arg)}` : String(arg))).join(' '));
    });
    await signNowClient
      .request({ token: 'T', method: 'POST', path: '/document/d/invite', operation: 'send invite', body: { secret: 'SECRET-PAYLOAD' } })
      .catch(() => undefined);
    expect(logged.join(' ')).not.toContain('SECRET-PAYLOAD');
    vi.restoreAllMocks();
  });

  test('a redirect is not followed and becomes an error', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(null, { status: 302, headers: { location: 'https://evil.example' } })));
    await expect(signNowClient.request({ token: 'T', method: 'GET', path: '/user', operation: 'get user' })).rejects.toThrow(/HTTP 302/);
  });

  test('download asks for a PDF explicitly', async () => {
    const seen = stubFetch({ body: 'PDF' });
    await signNowClient.download({ token: 'T', method: 'GET', path: '/document/d/download', operation: 'download document', accept: 'application/pdf' });
    expect(new Headers(seen[0].init.headers).get('accept')).toBe('application/pdf');
  });
});
