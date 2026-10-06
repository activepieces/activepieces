import { createVerify, generateKeyPairSync } from 'node:crypto';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { sendRequest } = vi.hoisted(() => ({
  sendRequest: vi.fn<() => Promise<{ body: unknown }>>(),
}));

vi.mock('@activepieces/pieces-common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@activepieces/pieces-common')>();
  return { ...actual, httpClient: { sendRequest } };
});

const { HttpError } = await import('@activepieces/pieces-common');
const { GOOGLE_TOKEN_URL, buildAssertion, clearTokenCache, mintServiceAccountToken, normalizePrivateKey, parseServiceAccountKey, validateServiceAccountConnection } =
  await import('../../../src/lib/common/service-account');

const { privateKey, publicKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

const KEY = { clientEmail: 'bot@my-project.iam.gserviceaccount.com', privateKey, projectId: 'my-project' };
const KEY_FILE = JSON.stringify({ type: 'service_account', project_id: 'my-project', client_email: KEY.clientEmail, private_key: privateKey });
const SCOPE = 'https://www.googleapis.com/auth/cloud-platform';

function decodeSegment(segment: string): Record<string, unknown> {
  return JSON.parse(Buffer.from(segment, 'base64url').toString('utf8'));
}

const fetchMock = vi.fn<(input: unknown, init?: RequestInit) => Promise<Response>>();

function tokenResponse({ status = 200, body }: { status?: number; body: unknown }): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

function sentForm(call: number): URLSearchParams {
  return new URLSearchParams(String(fetchMock.mock.calls[call]?.[1]?.body ?? ''));
}

function errorChain(error: unknown): string {
  const parts: string[] = [];
  let current: unknown = error;
  while (current instanceof Error) {
    parts.push(current.message, current.stack ?? '');
    current = current.cause;
  }
  if (current !== undefined) parts.push(String(current));
  return parts.join('\n');
}

function useFetchStub(): void {
  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockImplementation(async (input) => {
      throw new Error(`Unexpected network call in tests: ${String(input)}`);
    });
    vi.stubGlobal('fetch', fetchMock);
    sendRequest.mockReset();
    clearTokenCache();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });
}

function httpError(status: number, data: unknown): InstanceType<typeof HttpError> {
  return new HttpError({}, { status, responseBody: data });
}

describe('normalizePrivateKey()', () => {
  it('should turn the literal newline sequences of a JSON key file into newlines and strip quotes', () => {
    const pasted = `"${privateKey.replace(/\n/g, '\\n')}"`;
    expect(normalizePrivateKey(pasted)).toBe(privateKey);
  });

  it('should refuse anything that is not a PEM private key', () => {
    expect(() => normalizePrivateKey('AIzaSy-not-a-key')).toThrow('must be the PEM block');
  });
});

describe('parseServiceAccountKey()', () => {
  it('should read client_email, private_key and project_id from the pasted file', () => {
    expect(parseServiceAccountKey(KEY_FILE)).toEqual({ ...KEY, privateKey: privateKey.trim() });
  });

  it('should tolerate code fences and whitespace around the JSON', () => {
    expect(parseServiceAccountKey(`\n\`\`\`json\n${KEY_FILE}\n\`\`\`\n`).clientEmail).toBe(KEY.clientEmail);
  });

  it('should explain an empty, non-JSON, wrong-type or incomplete key', () => {
    expect(() => parseServiceAccountKey('')).toThrow('Paste the service account key file');
    expect(() => parseServiceAccountKey('not json')).toThrow('not valid JSON');
    expect(() => parseServiceAccountKey('{"type":"authorized_user"}')).toThrow('has type "authorized_user"');
    expect(() => parseServiceAccountKey('{"type":"service_account","client_email":"a@b"}')).toThrow('must contain client_email and private_key');
  });
});

describe('buildAssertion()', () => {
  it('should build an RS256 JWT without a sub claim, verifiable with the public key', () => {
    const jwt = buildAssertion({ key: KEY, scopes: [SCOPE], now: 1_700_000_000 });
    const [header, claims, signature] = jwt.split('.');

    expect(decodeSegment(header)).toEqual({ alg: 'RS256', typ: 'JWT' });
    expect(decodeSegment(claims)).toEqual({ iss: KEY.clientEmail, scope: SCOPE, aud: GOOGLE_TOKEN_URL, iat: 1_700_000_000, exp: 1_700_003_600 });
    expect(createVerify('RSA-SHA256').update(`${header}.${claims}`).end().verify(publicKey, signature, 'base64url')).toBe(true);
  });
});

describe('mintServiceAccountToken()', () => {
  useFetchStub();

  it('should POST the jwt-bearer grant with fetch and return the access token', async () => {
    fetchMock.mockResolvedValue(tokenResponse({ body: { access_token: 'ya29.minted', expires_in: 3600 } }));

    await expect(mintServiceAccountToken({ key: KEY, scopes: [SCOPE] })).resolves.toBe('ya29.minted');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe(GOOGLE_TOKEN_URL);
    expect(init?.method).toBe('POST');
    expect(init?.headers).toEqual({ 'Content-Type': 'application/x-www-form-urlencoded' });
    expect(sentForm(0).get('grant_type')).toBe('urn:ietf:params:oauth:grant-type:jwt-bearer');
    expect(sentForm(0).get('assertion')).toMatch(/^[\w-]+\.[\w-]+\.[\w-]+$/);
    expect(sendRequest).not.toHaveBeenCalled();
  });

  it('should give the token request a 30 second deadline that also covers reading the answer', async () => {
    const timeout = vi.spyOn(AbortSignal, 'timeout');
    fetchMock.mockResolvedValue(tokenResponse({ body: { access_token: 'ya29.deadline', expires_in: 3600 } }));

    await expect(mintServiceAccountToken({ key: KEY, scopes: [SCOPE] })).resolves.toBe('ya29.deadline');

    expect(timeout).toHaveBeenCalledTimes(1);
    expect(timeout).toHaveBeenCalledWith(30_000);
    const signal = fetchMock.mock.calls[0]?.[1]?.signal;
    expect(signal).toBeInstanceOf(AbortSignal);
    expect(signal).toBe(timeout.mock.results[0]?.value);
  });

  it('should explain a token request that ran past the deadline without leaking the assertion', async () => {
    const stalls = [
      async (): Promise<Response> => {
        throw new DOMException('The operation was aborted due to timeout', 'TimeoutError');
      },
      async (): Promise<Response> => {
        throw new DOMException('This operation was aborted', 'AbortError');
      },
      async (): Promise<Response> =>
        new Response(
          new ReadableStream({
            start(controller) {
              controller.error(new DOMException('The operation was aborted due to timeout', 'TimeoutError'));
            },
          }),
          { status: 200 }
        ),
    ];

    for (const stall of stalls) {
      clearTokenCache();
      fetchMock.mockReset();
      fetchMock.mockImplementation(stall);
      const error = await mintServiceAccountToken({ key: KEY, scopes: [SCOPE] }).then(
        () => undefined,
        (e: unknown) => e
      );
      const assertion = sentForm(0).get('assertion') ?? '';

      expect(error).toBeInstanceOf(Error);
      expect(error instanceof Error ? error.message : '').toBe('Google token endpoint did not answer within 30 seconds. Try again in a moment.');
      expect(error instanceof Error ? error.cause : 'not an error').toBeUndefined();
      expect(assertion.length).toBeGreaterThan(100);
      expect(errorChain(error)).not.toContain(assertion);
      expect(errorChain(error)).not.toContain(assertion.split('.')[2]);
    }
  });

  it('should reuse the token for the same key and scopes until it nears expiry', async () => {
    fetchMock.mockImplementation(async () => tokenResponse({ body: { access_token: 'ya29.cached', expires_in: 3600 } }));

    await mintServiceAccountToken({ key: KEY, scopes: [SCOPE] });
    await mintServiceAccountToken({ key: KEY, scopes: [SCOPE] });
    await mintServiceAccountToken({ key: { ...KEY, clientEmail: 'other@my-project.iam.gserviceaccount.com' }, scopes: [SCOPE] });

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('should not share a token between keys with the same client_email but different private keys', async () => {
    const other = generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });
    fetchMock
      .mockResolvedValueOnce(tokenResponse({ body: { access_token: 'ya29.first', expires_in: 3600 } }))
      .mockResolvedValueOnce(tokenResponse({ body: { access_token: 'ya29.second', expires_in: 3600 } }));

    await expect(mintServiceAccountToken({ key: KEY, scopes: [SCOPE] })).resolves.toBe('ya29.first');
    await expect(mintServiceAccountToken({ key: { ...KEY, privateKey: other.privateKey }, scopes: [SCOPE] })).resolves.toBe('ya29.second');
    await expect(mintServiceAccountToken({ key: KEY, scopes: [SCOPE] })).resolves.toBe('ya29.first');

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('should mint again once the cached token nears expiry', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    fetchMock
      .mockResolvedValueOnce(tokenResponse({ body: { access_token: 'ya29.old', expires_in: 3600 } }))
      .mockResolvedValueOnce(tokenResponse({ body: { access_token: 'ya29.new', expires_in: 3600 } }));

    await expect(mintServiceAccountToken({ key: KEY, scopes: [SCOPE] })).resolves.toBe('ya29.old');
    vi.setSystemTime(new Date('2026-01-01T00:55:00Z'));
    await expect(mintServiceAccountToken({ key: KEY, scopes: [SCOPE] })).resolves.toBe('ya29.new');
  });

  it('should drop expired tokens so they do not take a slot in the cache', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    let minted = 0;
    fetchMock.mockImplementation(async () => {
      minted += 1;
      return tokenResponse({ body: { access_token: `ya29.${minted}`, expires_in: minted === 100 ? 400 : 3600 } });
    });

    for (let i = 0; i < 100; i++) {
      await mintServiceAccountToken({ key: KEY, scopes: [`${SCOPE}/s${i}`] });
    }
    vi.setSystemTime(new Date('2026-01-01T00:03:20Z'));
    await mintServiceAccountToken({ key: KEY, scopes: [`${SCOPE}/new`] });
    expect(fetchMock).toHaveBeenCalledTimes(101);

    await expect(mintServiceAccountToken({ key: KEY, scopes: [`${SCOPE}/s0`] })).resolves.toBe('ya29.1');
    expect(fetchMock).toHaveBeenCalledTimes(101);

    await expect(mintServiceAccountToken({ key: KEY, scopes: [`${SCOPE}/s99`] })).resolves.toBe('ya29.102');
    expect(fetchMock).toHaveBeenCalledTimes(102);
  });

  it('should keep at most 100 tokens and evict the oldest first', async () => {
    let minted = 0;
    fetchMock.mockImplementation(async () => {
      minted += 1;
      return tokenResponse({ body: { access_token: `ya29.${minted}`, expires_in: 3600 } });
    });

    for (let i = 0; i <= 100; i++) {
      await mintServiceAccountToken({ key: KEY, scopes: [`${SCOPE}/s${i}`] });
    }
    expect(fetchMock).toHaveBeenCalledTimes(101);

    await expect(mintServiceAccountToken({ key: KEY, scopes: [`${SCOPE}/s100`] })).resolves.toBe('ya29.101');
    await expect(mintServiceAccountToken({ key: KEY, scopes: [`${SCOPE}/s1`] })).resolves.toBe('ya29.2');
    expect(fetchMock).toHaveBeenCalledTimes(101);

    await expect(mintServiceAccountToken({ key: KEY, scopes: [`${SCOPE}/s0`] })).resolves.toBe('ya29.102');
    expect(fetchMock).toHaveBeenCalledTimes(102);
  });

  it('should explain an invalid_grant answer', async () => {
    fetchMock.mockResolvedValue(tokenResponse({ status: 400, body: { error: 'invalid_grant', error_description: 'Invalid JWT Signature.' } }));

    await expect(mintServiceAccountToken({ key: KEY, scopes: [SCOPE] })).rejects.toThrow(
      'Google rejected the service account (invalid_grant): Invalid JWT Signature. Check that the key was not deleted or disabled'
    );
  });

  it('should explain an invalid_client answer and a non-JSON failure', async () => {
    fetchMock.mockResolvedValueOnce(tokenResponse({ status: 401, body: { error: 'invalid_client', error_description: 'The OAuth client was not found.' } }));
    await expect(mintServiceAccountToken({ key: KEY, scopes: [SCOPE] })).rejects.toThrow(
      '(invalid_client): The OAuth client was not found. The client_email of the key file was not recognised'
    );

    fetchMock.mockResolvedValueOnce(new Response('<html>Bad Gateway</html>', { status: 502 }));
    await expect(mintServiceAccountToken({ key: KEY, scopes: [SCOPE] })).rejects.toThrow('Google token endpoint returned 502.');
  });

  it('should report a successful answer without an access token', async () => {
    fetchMock.mockResolvedValue(tokenResponse({ body: { error: 'weird', error_description: 'no token' } }));

    await expect(mintServiceAccountToken({ key: KEY, scopes: [SCOPE] })).rejects.toThrow('Google token endpoint returned no access token (weird: no token).');
  });

  it('should never put the signed assertion in the error, its cause chain or the console', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const failures = [
      async () => tokenResponse({ status: 400, body: { error: 'invalid_grant', error_description: 'Invalid JWT Signature.' } }),
      async () => new Response('oops', { status: 500 }),
      async (): Promise<Response> => {
        throw new TypeError('fetch failed');
      },
    ];

    for (const failure of failures) {
      clearTokenCache();
      fetchMock.mockReset();
      fetchMock.mockImplementation(failure);
      const error = await mintServiceAccountToken({ key: KEY, scopes: [SCOPE] }).then(
        () => undefined,
        (e: unknown) => e
      );
      const assertion = sentForm(0).get('assertion') ?? '';

      expect(error).toBeInstanceOf(Error);
      expect(assertion.length).toBeGreaterThan(100);
      expect(errorChain(error)).not.toContain(assertion);
      expect(errorChain(error)).not.toContain(assertion.split('.')[2]);
      expect(error instanceof Error ? error.cause : 'not an error').toBeUndefined();
    }
    expect(consoleError).not.toHaveBeenCalled();
  });
});

describe('validateServiceAccountConnection()', () => {
  useFetchStub();

  it('should pass when the project/location has processors', async () => {
    fetchMock.mockResolvedValueOnce(tokenResponse({ body: { access_token: 'ya29.t', expires_in: 3600 } }));
    sendRequest.mockResolvedValueOnce({ body: { processors: [{ name: 'projects/1/locations/us/processors/abc' }] } });

    await expect(validateServiceAccountConnection({ keyFile: KEY_FILE, location: 'US' })).resolves.toEqual({ valid: true });
    expect(sendRequest).toHaveBeenLastCalledWith(
      expect.objectContaining({ url: 'https://us-documentai.googleapis.com/v1/projects/my-project/locations/us/processors' })
    );
  });

  it('should fail with the API message when the API is disabled, and when no processor exists', async () => {
    fetchMock.mockResolvedValueOnce(tokenResponse({ body: { access_token: 'ya29.t', expires_in: 3600 } }));
    sendRequest.mockRejectedValueOnce(httpError(403, { error: { code: 403, status: 'PERMISSION_DENIED', message: 'Cloud Document AI API has not been used in project my-project before or it is disabled.', details: [{ reason: 'SERVICE_DISABLED' }] } }));
    const disabled = await validateServiceAccountConnection({ keyFile: KEY_FILE, location: 'us' });
    expect(disabled).toEqual({ valid: false, error: expect.stringContaining('Enable the Cloud Document AI API') });

    sendRequest.mockResolvedValueOnce({ body: { processors: [] } });
    const empty = await validateServiceAccountConnection({ keyFile: KEY_FILE, location: 'eu', projectId: 'other-project' });
    expect(empty).toEqual({ valid: false, error: expect.stringContaining('No processors found in project other-project, location eu') });
  });

  it('should fail on a bad key without calling Google', async () => {
    const result = await validateServiceAccountConnection({ keyFile: '{"type":"service_account"}', location: 'us' });
    expect(result).toEqual({ valid: false, error: expect.stringContaining('must contain client_email and private_key') });
    expect(sendRequest).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
