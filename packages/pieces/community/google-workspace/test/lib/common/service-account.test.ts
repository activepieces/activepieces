import { createVerify, generateKeyPairSync } from 'node:crypto';

import { beforeEach, describe, expect, it, vi } from 'vitest';

const { sendRequest } = vi.hoisted(() => ({
  sendRequest: vi.fn<() => Promise<{ body: unknown }>>(),
}));

vi.mock('@activepieces/pieces-common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@activepieces/pieces-common')>();
  return { ...actual, httpClient: { sendRequest } };
});

const { HttpError } = await import('@activepieces/pieces-common');
const { GOOGLE_TOKEN_URL, buildAssertion, clearTokenCache, mintServiceAccountToken, normalizePrivateKey, validateServiceAccount } =
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

function httpError(status: number, data: unknown): InstanceType<typeof HttpError> {
  return new HttpError({}, { status, responseBody: data });
}

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
  beforeEach(() => {
    sendRequest.mockReset();
    clearTokenCache();
  });

  it('should POST the jwt-bearer grant and return the access token', async () => {
    sendRequest.mockResolvedValue({ body: { access_token: 'ya29.minted', expires_in: 3600 } });

    await expect(mintServiceAccountToken({ creds: CREDS, scopes: SCOPES })).resolves.toBe('ya29.minted');

    const request = sendRequest.mock.calls[0]?.[0] as unknown as { method: string; url: string; headers: unknown; body: string };
    expect(request.method).toBe('POST');
    expect(request.url).toBe(GOOGLE_TOKEN_URL);
    expect(request.headers).toEqual({ 'Content-Type': 'application/x-www-form-urlencoded' });
    const form = new URLSearchParams(request.body);
    expect(form.get('grant_type')).toBe('urn:ietf:params:oauth:grant-type:jwt-bearer');
    expect(form.get('assertion')).toMatch(/^[\w-]+\.[\w-]+\.[\w-]+$/);
  });

  it('should reuse the token for the same credentials and scopes until it nears expiry', async () => {
    sendRequest.mockResolvedValue({ body: { access_token: 'ya29.cached', expires_in: 3600 } });

    await mintServiceAccountToken({ creds: CREDS, scopes: SCOPES });
    await mintServiceAccountToken({ creds: CREDS, scopes: SCOPES });
    await mintServiceAccountToken({ creds: { ...CREDS, adminEmail: 'other@example.com' }, scopes: SCOPES });

    expect(sendRequest).toHaveBeenCalledTimes(2);
  });

  it('should not share a cached token between connections with the same e-mail but different private keys', async () => {
    const { privateKey: otherKey } = generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });
    sendRequest
      .mockResolvedValueOnce({ body: { access_token: 'ya29.first', expires_in: 3600 } })
      .mockResolvedValueOnce({ body: { access_token: 'ya29.second', expires_in: 3600 } });

    await expect(mintServiceAccountToken({ creds: CREDS, scopes: SCOPES })).resolves.toBe('ya29.first');
    await expect(mintServiceAccountToken({ creds: { ...CREDS, privateKey: otherKey }, scopes: SCOPES })).resolves.toBe('ya29.second');
    await expect(
      mintServiceAccountToken({ creds: { ...CREDS, privateKey: privateKey.replace(/\n/g, '\\n') }, scopes: SCOPES })
    ).resolves.toBe('ya29.first');

    expect(sendRequest).toHaveBeenCalledTimes(2);
  });

  it('should explain an unauthorized_client answer as a missing domain-wide delegation', async () => {
    sendRequest.mockRejectedValue(
      httpError(401, { error: 'unauthorized_client', error_description: 'Client is unauthorized to retrieve access tokens using this method.' })
    );

    await expect(mintServiceAccountToken({ creds: CREDS, scopes: SCOPES })).rejects.toThrow(
      'Google rejected the service account (unauthorized_client): Client is unauthorized to retrieve access tokens using this method. Check that domain-wide delegation is authorized'
    );
  });

  it('should fail when Google answers 200 without a token', async () => {
    sendRequest.mockResolvedValue({ body: { error: 'invalid_scope', error_description: 'Invalid scope' } });

    await expect(mintServiceAccountToken({ creds: CREDS, scopes: SCOPES })).rejects.toThrow('no access token (invalid_scope: Invalid scope)');
  });
});

describe('validateServiceAccount()', () => {
  beforeEach(() => {
    sendRequest.mockReset();
    clearTokenCache();
  });

  it('should mint a token and accept an administrator', async () => {
    sendRequest
      .mockResolvedValueOnce({ body: { access_token: 'ya29.v', expires_in: 3600 } })
      .mockResolvedValueOnce({ body: { primaryEmail: 'admin@example.com', isAdmin: true } });

    await expect(validateServiceAccount(CREDS)).resolves.toEqual({ valid: true });
    expect(sendRequest).toHaveBeenLastCalledWith(
      expect.objectContaining({
        url: 'https://admin.googleapis.com/admin/directory/v1/users/admin%40example.com',
        authentication: { type: 'BEARER_TOKEN', token: 'ya29.v' },
      })
    );
  });

  it('should reject a user that is not an administrator', async () => {
    sendRequest
      .mockResolvedValueOnce({ body: { access_token: 'ya29.v', expires_in: 3600 } })
      .mockResolvedValueOnce({ body: { primaryEmail: 'admin@example.com', isAdmin: false, isDelegatedAdmin: false } });

    await expect(validateServiceAccount(CREDS)).resolves.toEqual({
      valid: false,
      error: 'admin@example.com is not a Workspace administrator; pick a user with an admin role.',
    });
  });

  it('should surface the token error as the validation error', async () => {
    sendRequest.mockRejectedValue(httpError(400, { error: 'invalid_grant', error_description: 'Invalid email or User ID' }));

    const result = await validateServiceAccount(CREDS);

    expect(result.valid).toBe(false);
    expect(result).toMatchObject({ error: expect.stringContaining('invalid_grant') });
  });

  it('should reject a malformed key without calling Google', async () => {
    const result = await validateServiceAccount({ ...CREDS, privateKey: 'nope' });

    expect(result).toEqual({ valid: false, error: expect.stringContaining('PEM block') });
    expect(sendRequest).not.toHaveBeenCalled();
  });
});
