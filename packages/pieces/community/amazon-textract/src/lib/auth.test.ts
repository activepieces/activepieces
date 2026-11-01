import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { sendMock } = vi.hoisted(() => ({ sendMock: vi.fn() }));

vi.mock('@aws-sdk/client-sts', () => ({
  STSClient: vi.fn(() => ({ send: sendMock })),
  AssumeRoleWithWebIdentityCommand: vi.fn((input: unknown) => ({ input })),
}));

import { PieceServerContextError } from '@activepieces/pieces-framework';
import { amazonTextractOidcAuth } from './auth';
import { createTextractClient } from './common';

const mintOidcToken = vi.fn();

const validationServer = {
  apiUrl: 'http://127.0.0.1:4200/api/',
  publicUrl: 'http://127.0.0.1:4200/api/',
  mintOidcToken,
};

const runtimeServer = {
  apiUrl: 'http://127.0.0.1:3000/',
  publicUrl: 'http://127.0.0.1:4200/api/',
  token: 'engine-token',
};

const stsCredentials = {
  Credentials: {
    AccessKeyId: 'ASIATEMP',
    SecretAccessKey: 'temp-secret',
    SessionToken: 'temp-session',
    Expiration: new Date(Date.now() + 3_600_000),
  },
};

describe('amazonTextractOidcAuth.validate', () => {
  beforeEach(() => {
    sendMock.mockReset();
    mintOidcToken.mockReset();
    mintOidcToken.mockResolvedValue('signed-oidc-token');
  });

  it('rejects a malformed role ARN without calling AWS', async () => {
    const result = await amazonTextractOidcAuth.validate?.({
      auth: { roleArn: 'not-an-arn', region: 'us-east-1' },
      server: validationServer,
    });

    expect(result).toEqual({
      valid: false,
      error: 'Invalid IAM Role ARN format. Expected: arn:aws:iam::123456789012:role/RoleName',
    });
    expect(mintOidcToken).not.toHaveBeenCalled();
    expect(sendMock).not.toHaveBeenCalled();
  });

  it('rejects a region that is not an AWS region before reaching AWS', async () => {
    const result = await amazonTextractOidcAuth.validate?.({
      auth: { roleArn: 'arn:aws:iam::123456789012:role/valid-shape', region: 'us-east-1.evil.com' },
      server: validationServer,
    });

    expect(result).toEqual({ valid: false, error: 'Invalid AWS region: us-east-1.evil.com' });
    expect(mintOidcToken).not.toHaveBeenCalled();
    expect(sendMock).not.toHaveBeenCalled();
  });

  it('returns the STS error when the role cannot be assumed', async () => {
    const stsError = new Error('Not authorized to perform sts:AssumeRoleWithWebIdentity');
    stsError.name = 'AccessDenied';
    sendMock.mockRejectedValue(stsError);

    const result = await amazonTextractOidcAuth.validate?.({
      auth: { roleArn: 'arn:aws:iam::123456789012:role/untrusted', region: 'us-east-1' },
      server: validationServer,
    });

    expect(result).toEqual({
      valid: false,
      error: 'AccessDenied: Not authorized to perform sts:AssumeRoleWithWebIdentity',
    });
    expect(mintOidcToken).toHaveBeenCalledWith({ audience: 'sts.amazonaws.com' });
    expect(sendMock.mock.calls[0][0].input).toMatchObject({
      RoleArn: 'arn:aws:iam::123456789012:role/untrusted',
      WebIdentityToken: 'signed-oidc-token',
    });
  });

  it('re-throws PieceServerContextError so an engine failure is not reported as an invalid connection', async () => {
    mintOidcToken.mockRejectedValue(new PieceServerContextError('Failed to get OIDC token: Forbidden'));

    await expect(
      amazonTextractOidcAuth.validate?.({
        auth: { roleArn: 'arn:aws:iam::123456789012:role/token-endpoint-down', region: 'us-east-1' },
        server: validationServer,
      }),
    ).rejects.toBeInstanceOf(PieceServerContextError);
    expect(sendMock).not.toHaveBeenCalled();
  });

  it('accepts when the role assumption succeeds', async () => {
    sendMock.mockResolvedValue(stsCredentials);

    const result = await amazonTextractOidcAuth.validate?.({
      auth: { roleArn: 'arn:aws:iam::123456789012:role/assumable-role', region: 'us-east-1' },
      server: validationServer,
    });

    expect(result).toEqual({ valid: true });
  });
});

describe('createTextractClient', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    sendMock.mockReset();
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('uses temporary credentials from the assumed role for an OIDC connection', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ token: 'engine-oidc-token' }) });
    sendMock.mockResolvedValue(stsCredentials);

    const client = await createTextractClient({
      auth: { roleArn: 'arn:aws:iam::123456789012:role/textract', region: 'eu-west-1' },
      server: runtimeServer,
    });

    expect(fetchMock).toHaveBeenCalledWith('http://127.0.0.1:3000/v1/worker/oidc-token', expect.objectContaining({ method: 'POST' }));
    expect(sendMock.mock.calls[0][0].input).toMatchObject({
      RoleArn: 'arn:aws:iam::123456789012:role/textract',
      WebIdentityToken: 'engine-oidc-token',
    });
    await expect(client.config.credentials()).resolves.toMatchObject({
      accessKeyId: 'ASIATEMP',
      secretAccessKey: 'temp-secret',
      sessionToken: 'temp-session',
    });
    await expect(client.config.region()).resolves.toBe('eu-west-1');
  });

  it('uses the static keys for an access key connection without calling STS', async () => {
    const client = await createTextractClient({
      auth: { accessKeyId: 'AKIASTATIC', secretAccessKey: 'static-secret', region: 'us-east-2' },
      server: runtimeServer,
    });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(sendMock).not.toHaveBeenCalled();
    await expect(client.config.credentials()).resolves.toMatchObject({
      accessKeyId: 'AKIASTATIC',
      secretAccessKey: 'static-secret',
    });
  });

  it('reuses cached credentials for the same run instead of assuming the role again', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ token: 'engine-oidc-token' }) });
    sendMock.mockResolvedValue(stsCredentials);
    const params = {
      auth: { roleArn: 'arn:aws:iam::123456789012:role/cached', region: 'us-east-1' },
      server: runtimeServer,
    };

    await createTextractClient(params);
    const client = await createTextractClient(params);
    await client.config.credentials();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(sendMock).toHaveBeenCalledTimes(1);
  });

  it('never shares cached credentials between runs that assume the same role', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ token: 'engine-oidc-token' }) });
    sendMock
      .mockResolvedValueOnce({ Credentials: { ...stsCredentials.Credentials, AccessKeyId: 'ASIARUNA' } })
      .mockResolvedValueOnce({ Credentials: { ...stsCredentials.Credentials, AccessKeyId: 'ASIARUNB' } });
    const auth = { roleArn: 'arn:aws:iam::123456789012:role/shared-role', region: 'us-east-1' };

    const clientA = await createTextractClient({ auth, server: { ...runtimeServer, token: 'engine-token-run-a' } });
    const clientB = await createTextractClient({ auth, server: { ...runtimeServer, token: 'engine-token-run-b' } });

    await expect(clientA.config.credentials()).resolves.toMatchObject({ accessKeyId: 'ASIARUNA' });
    await expect(clientB.config.credentials()).resolves.toMatchObject({ accessKeyId: 'ASIARUNB' });
    expect(sendMock).toHaveBeenCalledTimes(2);
  });

  it('refreshes credentials that are close to expiry so long-running actions keep working', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ token: 'engine-oidc-token' }) });
    sendMock
      .mockResolvedValueOnce({
        Credentials: { ...stsCredentials.Credentials, AccessKeyId: 'ASIASTALE', Expiration: new Date(Date.now() + 60_000) },
      })
      .mockResolvedValueOnce({
        Credentials: { ...stsCredentials.Credentials, AccessKeyId: 'ASIAFRESH', Expiration: new Date(Date.now() + 3_600_000) },
      });

    const client = await createTextractClient({
      auth: { roleArn: 'arn:aws:iam::123456789012:role/refreshing', region: 'us-east-1' },
      server: runtimeServer,
    });

    await expect(client.config.credentials()).resolves.toMatchObject({ accessKeyId: 'ASIAFRESH' });
    expect(sendMock).toHaveBeenCalledTimes(2);
  });

  it('reports the HTTP status when the engine cannot mint an OIDC token', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 403, statusText: 'Forbidden' });

    await expect(
      createTextractClient({
        auth: { roleArn: 'arn:aws:iam::123456789012:role/token-denied', region: 'us-east-1' },
        server: runtimeServer,
      }),
    ).rejects.toThrow('Failed to get OIDC token: 403 Forbidden');
    expect(sendMock).not.toHaveBeenCalled();
  });

  it('does not call STS when the token response has no token', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({}) });

    await expect(
      createTextractClient({
        auth: { roleArn: 'arn:aws:iam::123456789012:role/token-missing', region: 'us-east-1' },
        server: runtimeServer,
      }),
    ).rejects.toThrow('Failed to get OIDC token: the response did not include a token');
    expect(sendMock).not.toHaveBeenCalled();
  });
});
