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
  beforeEach(() => {
    sendRequest.mockReset();
    clearTokenCache();
  });

  it('should POST the jwt-bearer grant and return the access token', async () => {
    sendRequest.mockResolvedValue({ body: { access_token: 'ya29.minted', expires_in: 3600 } });

    await expect(mintServiceAccountToken({ key: KEY, scopes: [SCOPE] })).resolves.toBe('ya29.minted');

    const request = sendRequest.mock.calls[0]?.[0] as unknown as { method: string; url: string; headers: unknown; body: string };
    expect(request.method).toBe('POST');
    expect(request.url).toBe(GOOGLE_TOKEN_URL);
    expect(request.headers).toEqual({ 'Content-Type': 'application/x-www-form-urlencoded' });
    const form = new URLSearchParams(request.body);
    expect(form.get('grant_type')).toBe('urn:ietf:params:oauth:grant-type:jwt-bearer');
    expect(form.get('assertion')).toMatch(/^[\w-]+\.[\w-]+\.[\w-]+$/);
  });

  it('should reuse the token for the same key and scopes until it nears expiry', async () => {
    sendRequest.mockResolvedValue({ body: { access_token: 'ya29.cached', expires_in: 3600 } });

    await mintServiceAccountToken({ key: KEY, scopes: [SCOPE] });
    await mintServiceAccountToken({ key: KEY, scopes: [SCOPE] });
    await mintServiceAccountToken({ key: { ...KEY, clientEmail: 'other@my-project.iam.gserviceaccount.com' }, scopes: [SCOPE] });

    expect(sendRequest).toHaveBeenCalledTimes(2);
  });

  it('should not share a token between keys with the same client_email but different private keys', async () => {
    const other = generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });
    sendRequest
      .mockResolvedValueOnce({ body: { access_token: 'ya29.first', expires_in: 3600 } })
      .mockResolvedValueOnce({ body: { access_token: 'ya29.second', expires_in: 3600 } });

    await expect(mintServiceAccountToken({ key: KEY, scopes: [SCOPE] })).resolves.toBe('ya29.first');
    await expect(mintServiceAccountToken({ key: { ...KEY, privateKey: other.privateKey }, scopes: [SCOPE] })).resolves.toBe('ya29.second');
    await expect(mintServiceAccountToken({ key: KEY, scopes: [SCOPE] })).resolves.toBe('ya29.first');

    expect(sendRequest).toHaveBeenCalledTimes(2);
  });

  it('should explain an invalid_grant answer', async () => {
    sendRequest.mockRejectedValue(httpError(400, { error: 'invalid_grant', error_description: 'Invalid JWT Signature.' }));

    await expect(mintServiceAccountToken({ key: KEY, scopes: [SCOPE] })).rejects.toThrow(
      'Google rejected the service account (invalid_grant): Invalid JWT Signature. Check that the key was not deleted or disabled'
    );
  });
});

describe('validateServiceAccountConnection()', () => {
  beforeEach(() => {
    sendRequest.mockReset();
    clearTokenCache();
  });

  it('should pass when the project/location has processors', async () => {
    sendRequest
      .mockResolvedValueOnce({ body: { access_token: 'ya29.t', expires_in: 3600 } })
      .mockResolvedValueOnce({ body: { processors: [{ name: 'projects/1/locations/us/processors/abc' }] } });

    await expect(validateServiceAccountConnection({ keyFile: KEY_FILE, location: 'US' })).resolves.toEqual({ valid: true });
    expect(sendRequest).toHaveBeenLastCalledWith(
      expect.objectContaining({ url: 'https://us-documentai.googleapis.com/v1/projects/my-project/locations/us/processors' })
    );
  });

  it('should fail with the API message when the API is disabled, and when no processor exists', async () => {
    sendRequest
      .mockResolvedValueOnce({ body: { access_token: 'ya29.t', expires_in: 3600 } })
      .mockRejectedValueOnce(httpError(403, { error: { code: 403, status: 'PERMISSION_DENIED', message: 'Cloud Document AI API has not been used in project my-project before or it is disabled.', details: [{ reason: 'SERVICE_DISABLED' }] } }));
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
  });
});
