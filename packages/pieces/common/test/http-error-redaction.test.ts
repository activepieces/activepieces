/// <reference types="vitest/globals" />

import { httpClient, HttpError, HttpMethod, toFailsafeOutput } from '../src';

function stubFailingFetch(): void {
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ error: 'bad request' }), { status: 400, headers: { 'content-type': 'application/json' } })));
}

async function failingRequest(redactBodyInErrors?: boolean): Promise<{ thrown: unknown; logged: string }> {
  const logSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  const thrown = await httpClient
    .sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.example.com/v1/users',
      body: { email: 'a@b.c', password: 'hunter2' },
      ...(redactBodyInErrors === undefined ? {} : { redactBodyInErrors }),
    })
    .catch((error: unknown) => error);
  const logged = JSON.stringify(logSpy.mock.calls.map((call) => call.map((arg) => (arg instanceof Error ? arg.message : arg))));
  logSpy.mockRestore();
  return { thrown, logged };
}

describe('HttpError request body redaction', () => {
  beforeEach(() => stubFailingFetch());
  afterEach(() => vi.unstubAllGlobals());

  it('keeps the request body in the error and the log by default', async () => {
    const { thrown, logged } = await failingRequest();
    expect(thrown).toBeInstanceOf(HttpError);
    expect(thrown instanceof HttpError ? thrown.message : '').toContain('hunter2');
    expect(logged).toContain('hunter2');
  });

  it('replaces the request body with [redacted] when redactBodyInErrors is true', async () => {
    const { thrown, logged } = await failingRequest(true);
    if (!(thrown instanceof HttpError)) {
      throw new Error('expected an HttpError');
    }
    const error = thrown;
    expect(error.message).not.toContain('hunter2');
    expect(error.message).toContain('[redacted]');
    expect(error.response).toEqual({ status: 400, body: { error: 'bad request' } });
    expect(JSON.stringify(error.errorMessage())).not.toContain('hunter2');
    expect(logged).not.toContain('hunter2');
  });

  it('still returns the response body on success with redaction on', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ id: 1 }), { status: 200, headers: { 'content-type': 'application/json' } })));
    const response = await httpClient.sendRequest({ method: HttpMethod.POST, url: 'https://api.example.com/v1/users', body: { password: 'x' }, redactBodyInErrors: true });
    expect(response.body).toEqual({ id: 1 });
  });
});

describe('FetchHttpClient connect timeout and toFailsafeOutput error cause', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('passes an undici dispatcher when timeout is set and no custom dispatcher is provided', async () => {
    const fetchSpy = vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'content-type': 'application/json' } }));
    vi.stubGlobal('fetch', fetchSpy);

    await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.example.com/slow-connect',
      timeout: 30000,
    });

    const init = fetchSpy.mock.calls[0]?.[1] as { dispatcher?: unknown } | undefined;
    expect(init?.dispatcher).toBeDefined();
  });

  it('includes error.cause code and message in toFailsafeOutput', () => {
    const cause = Object.assign(
      new Error('Connect Timeout Error (attempted address: 10.255.255.1:80, timeout: 30000ms)'),
      { code: 'UND_ERR_CONNECT_TIMEOUT' }
    );
    const err = new TypeError('fetch failed', { cause });

    const output = toFailsafeOutput({ error: err, requestBody: { ping: 1 } });
    expect(output).toEqual({
      response: {
        status: 0,
        body: 'fetch failed (UND_ERR_CONNECT_TIMEOUT: Connect Timeout Error (attempted address: 10.255.255.1:80, timeout: 30000ms))',
      },
      request: {
        body: { ping: 1 },
      },
    });
  });
});
