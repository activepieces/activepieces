import { createVerify, generateKeyPairSync } from 'node:crypto';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const network = vi.hoisted(() => ({ unexpectedCalls: 0 }));
const fetchMock = vi.hoisted(() =>
  vi.fn<(input: string | URL | Request, init?: RequestInit) => Promise<Response>>(async () => {
    network.unexpectedCalls++;
    throw new Error('Unexpected real network call');
  })
);
vi.stubGlobal('fetch', fetchMock);

const { cachedTokenCount, GOOGLE_TOKEN_URL, buildAssertion, clearTokenCache, mintServiceAccountToken, normalizePrivateKey, validateServiceAccount } =
  await import('../../../src/lib/common/service-account');

const { privateKey, publicKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

const CREDS = {
  clientEmail: 'bot@my-project.iam.gserviceaccount.com',
  privateKey,
  adminEmail: 'admin@example.com',
};
const SCOPES = ['https://www.googleapis.com/auth/admin.directory.user'];

function decodeSegment(segment: string): Record<string, unknown> {
  return JSON.parse(Buffer.from(segment, 'base64url').toString('utf8'));
}

function tokenResponse(status: number, body: unknown): Response {
  return new Response(typeof body === 'string' ? body : JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

function answerWith(status: number, body: unknown): void {
  fetchMock.mockImplementation(async () => tokenResponse(status, body));
}

function sentAssertion(call = 0): string {
  const init = fetchMock.mock.calls[call]?.[1];
  return new URLSearchParams(String(init?.body ?? '')).get('assertion') ?? '';
}

function errorChainText(error: unknown): string {
  const parts: string[] = [];
  let current: unknown = error;
  while (current !== undefined && current !== null) {
    parts.push(current instanceof Error ? `${current.message} ${current.stack ?? ''}` : String(current));
    parts.push(typeof current === 'object' ? JSON.stringify(current, Object.getOwnPropertyNames(current)) : String(current));
    current = current instanceof Error ? current.cause : undefined;
  }
  return parts.join('\n');
}

async function captureRejection(promise: Promise<unknown>): Promise<unknown> {
  try {
    await promise;
  } catch (error) {
    return error;
  }
  throw new Error('expected the promise to reject');
}

beforeEach(() => {
  network.unexpectedCalls = 0;
  fetchMock.mockReset().mockImplementation(async () => {
    network.unexpectedCalls++;
    throw new Error('Unexpected real network call');
  });
  vi.stubGlobal('fetch', fetchMock);
  clearTokenCache();
});

afterEach(() => {
  expect(network.unexpectedCalls).toBe(0);
  expect(globalThis.fetch).toBe(fetchMock);
  vi.restoreAllMocks();
});

describe('normalizePrivateKey()', () => {
  it('should turn the literal newline sequences of a JSON key file into newlines and strip quotes', () => {
    const pasted = `"${privateKey.replace(/\n/g, '\\n')}"`;

    expect(normalizePrivateKey(pasted)).toBe(privateKey);
  });

  it('should rebuild a PEM whose newlines were lost in a one-line field or replaced by spaces', () => {
    const oneLine = privateKey.replace(/\n/g, '');
    const spaced = privateKey.replace(/\n/g, ' ');

    expect(normalizePrivateKey(oneLine)).toBe(privateKey);
    expect(normalizePrivateKey(spaced)).toBe(privateKey);
    expect(() => buildAssertion({ creds: { ...CREDS, privateKey: oneLine }, scopes: SCOPES, now: 1_700_000_000 })).not.toThrow();
  });

  it('should refuse anything that is not a PEM private key', () => {
    expect(() => normalizePrivateKey('AIzaSy-not-a-key')).toThrow('must be the PEM block');
    expect(() => normalizePrivateKey('-----BEGIN PRIVATE KEY-----\n***\n-----END PRIVATE KEY-----')).toThrow('must be the PEM block');
  });

  it('should explain a key Node cannot decode instead of leaking the OpenSSL code', () => {
    const corrupted = privateKey.replace(/\n/g, '').replace('MIIE', 'AAAA');
    expect(() => buildAssertion({ creds: { ...CREDS, privateKey: corrupted }, scopes: SCOPES, now: 1_700_000_000 })).toThrow('The private key could not be read');
  });
});

describe('buildAssertion()', () => {
  it('should build an RS256 JWT with the delegation claims, verifiable with the public key', () => {
    const jwt = buildAssertion({ creds: CREDS, scopes: SCOPES, now: 1_700_000_000 });
    const [header, claims, signature] = jwt.split('.') as [string, string, string];

    expect(decodeSegment(header)).toEqual({ alg: 'RS256', typ: 'JWT' });
    expect(decodeSegment(claims)).toEqual({
      iss: CREDS.clientEmail,
      sub: CREDS.adminEmail,
      scope: SCOPES[0],
      aud: GOOGLE_TOKEN_URL,
      iat: 1_700_000_000,
      exp: 1_700_003_600,
    });
    expect(createVerify('RSA-SHA256').update(`${header}.${claims}`).end().verify(publicKey, signature, 'base64url')).toBe(true);
  });
});

describe('mintServiceAccountToken()', () => {
  it('should POST the jwt-bearer grant with fetch and return the access token', async () => {
    answerWith(200, { access_token: 'ya29.minted', expires_in: 3600 });

    await expect(mintServiceAccountToken({ creds: CREDS, scopes: SCOPES })).resolves.toBe('ya29.minted');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe(GOOGLE_TOKEN_URL);
    expect(init?.method).toBe('POST');
    expect(init?.headers).toMatchObject({ 'Content-Type': 'application/x-www-form-urlencoded' });
    const form = new URLSearchParams(String(init?.body));
    expect(form.get('grant_type')).toBe('urn:ietf:params:oauth:grant-type:jwt-bearer');
    expect(form.get('assertion')).toMatch(/^[\w-]+\.[\w-]+\.[\w-]+$/);
  });

  it('should reuse the token for the same credentials and scopes until it nears expiry', async () => {
    answerWith(200, { access_token: 'ya29.cached', expires_in: 3600 });

    await mintServiceAccountToken({ creds: CREDS, scopes: SCOPES });
    await mintServiceAccountToken({ creds: CREDS, scopes: SCOPES });
    await mintServiceAccountToken({ creds: { ...CREDS, adminEmail: 'other@example.com' }, scopes: SCOPES });

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('should not share a cached token between connections with the same e-mail but different private keys', async () => {
    const { privateKey: otherKey } = generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });
    fetchMock
      .mockImplementationOnce(async () => tokenResponse(200, { access_token: 'ya29.first', expires_in: 3600 }))
      .mockImplementationOnce(async () => tokenResponse(200, { access_token: 'ya29.second', expires_in: 3600 }));

    await expect(mintServiceAccountToken({ creds: CREDS, scopes: SCOPES })).resolves.toBe('ya29.first');
    await expect(mintServiceAccountToken({ creds: { ...CREDS, privateKey: otherKey }, scopes: SCOPES })).resolves.toBe('ya29.second');
    await expect(
      mintServiceAccountToken({ creds: { ...CREDS, privateKey: privateKey.replace(/\n/g, '\\n') }, scopes: SCOPES })
    ).resolves.toBe('ya29.first');

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('should drop expired tokens from the cache when a new one is stored', async () => {
    const start = 1_700_000_000_000;
    const clock = vi.spyOn(Date, 'now').mockReturnValue(start);
    answerWith(200, { access_token: 'ya29.old', expires_in: 3600 });
    await mintServiceAccountToken({ creds: CREDS, scopes: SCOPES });
    expect(cachedTokenCount()).toBe(1);

    clock.mockReturnValue(start + 2 * 3600 * 1000);
    answerWith(200, { access_token: 'ya29.new', expires_in: 3600 });
    await mintServiceAccountToken({ creds: { ...CREDS, adminEmail: 'other@example.com' }, scopes: SCOPES });

    expect(cachedTokenCount()).toBe(1);
    await expect(mintServiceAccountToken({ creds: CREDS, scopes: SCOPES })).resolves.toBe('ya29.new');
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('should drop expired tokens from the cache on a lookup', async () => {
    const start = 1_700_000_000_000;
    const clock = vi.spyOn(Date, 'now').mockReturnValue(start);
    answerWith(200, { access_token: 'ya29.old', expires_in: 3600 });
    await mintServiceAccountToken({ creds: CREDS, scopes: SCOPES });

    clock.mockReturnValue(start + 2 * 3600 * 1000);
    answerWith(500, 'unavailable');
    await expect(mintServiceAccountToken({ creds: CREDS, scopes: SCOPES })).rejects.toThrow('Google token endpoint returned 500.');

    expect(cachedTokenCount()).toBe(0);
  });

  it('should keep at most 100 tokens, evicting the oldest first', async () => {
    let issued = 0;
    fetchMock.mockImplementation(async () => tokenResponse(200, { access_token: `ya29.${issued++}`, expires_in: 3600 }));
    const credsFor = (index: number) => ({ ...CREDS, adminEmail: `admin${index}@example.com` });

    for (let index = 0; index <= 100; index++) {
      await mintServiceAccountToken({ creds: credsFor(index), scopes: SCOPES });
    }

    expect(cachedTokenCount()).toBe(100);
    expect(fetchMock).toHaveBeenCalledTimes(101);
    await expect(mintServiceAccountToken({ creds: credsFor(1), scopes: SCOPES })).resolves.toBe('ya29.1');
    expect(fetchMock).toHaveBeenCalledTimes(101);
    await expect(mintServiceAccountToken({ creds: credsFor(0), scopes: SCOPES })).resolves.toBe('ya29.101');
    expect(fetchMock).toHaveBeenCalledTimes(102);
    expect(cachedTokenCount()).toBe(100);
  });

  it('should explain an unauthorized_client answer as a missing domain-wide delegation', async () => {
    answerWith(401, { error: 'unauthorized_client', error_description: 'Client is unauthorized to retrieve access tokens using this method.' });

    await expect(mintServiceAccountToken({ creds: CREDS, scopes: SCOPES })).rejects.toThrow(
      'Google rejected the service account (unauthorized_client): Client is unauthorized to retrieve access tokens using this method. Check that domain-wide delegation is authorized'
    );
  });

  it('should never put the signed assertion in the error or the logs when Google rejects it', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    answerWith(400, { error: 'invalid_grant', error_description: 'Invalid email or User ID' });

    const error = await captureRejection(mintServiceAccountToken({ creds: CREDS, scopes: SCOPES }));

    const assertion = sentAssertion();
    expect(assertion.length).toBeGreaterThan(100);
    expect(error).toBeInstanceOf(Error);
    expect(error instanceof Error ? error.message : '').toBe(
      'Google rejected the service account (invalid_grant): Invalid email or User ID Check the administrator e-mail (it must exist in your domain) and the server clock.'
    );
    expect(error instanceof Error ? error.cause : 'not an error').toBeUndefined();
    expect(errorChainText(error)).not.toContain(assertion);
    expect(errorChainText(error)).not.toContain(assertion.split('.')[2]);
    for (const call of [...consoleError.mock.calls, ...consoleLog.mock.calls]) {
      expect(errorChainText(call)).not.toContain(assertion);
    }
  });

  it('should report a non-JSON error answer by its status only', async () => {
    answerWith(502, '<html>Bad Gateway</html>');

    await expect(mintServiceAccountToken({ creds: CREDS, scopes: SCOPES })).rejects.toThrow(/^Google token endpoint returned 502\.$/);
  });

  it('should hide the request when the token endpoint cannot be reached', async () => {
    fetchMock.mockImplementation(async (_input, init) => {
      throw new TypeError('fetch failed', { cause: new Error(String(init?.body)) });
    });

    const error = await captureRejection(mintServiceAccountToken({ creds: CREDS, scopes: SCOPES }));

    expect(error instanceof Error ? error.message : '').toBe('Could not reach the Google token endpoint (TypeError). Try again in a moment.');
    expect(error instanceof Error ? error.cause : 'not an error').toBeUndefined();
    expect(errorChainText(error)).not.toContain(sentAssertion());
  });

  it('should fail when Google answers 200 without a token', async () => {
    answerWith(200, { error: 'invalid_scope', error_description: 'Invalid scope' });

    await expect(mintServiceAccountToken({ creds: CREDS, scopes: SCOPES })).rejects.toThrow('no access token (invalid_scope: Invalid scope)');
  });
});

describe('validateServiceAccount()', () => {
  function answerTokenThenUser(user: unknown): void {
    fetchMock.mockImplementation(async (input) =>
      String(input) === GOOGLE_TOKEN_URL ? tokenResponse(200, { access_token: 'ya29.v', expires_in: 3600 }) : tokenResponse(200, user)
    );
  }

  it('should mint a token and accept an administrator', async () => {
    answerTokenThenUser({ primaryEmail: 'admin@example.com', isAdmin: true });

    await expect(validateServiceAccount(CREDS)).resolves.toEqual({ valid: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [url, init] = fetchMock.mock.calls[1] ?? [];
    expect(String(url)).toBe('https://admin.googleapis.com/admin/directory/v1/users/admin%40example.com');
    expect(init?.method).toBe('GET');
    expect(init?.headers).toMatchObject({ Authorization: 'Bearer ya29.v' });
  });

  it('should reject a user that is not an administrator', async () => {
    answerTokenThenUser({ primaryEmail: 'admin@example.com', isAdmin: false, isDelegatedAdmin: false });

    await expect(validateServiceAccount(CREDS)).resolves.toEqual({
      valid: false,
      error: 'admin@example.com is not a Workspace administrator; pick a user with an admin role.',
    });
  });

  it('should surface the token error as the validation error', async () => {
    answerWith(400, { error: 'invalid_grant', error_description: 'Invalid email or User ID' });

    const result = await validateServiceAccount(CREDS);

    expect(result.valid).toBe(false);
    expect(result).toMatchObject({ error: expect.stringContaining('invalid_grant') });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('should reject a malformed key without calling Google', async () => {
    const result = await validateServiceAccount({ ...CREDS, privateKey: 'nope' });

    expect(result).toEqual({ valid: false, error: expect.stringContaining('PEM block') });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
