import { beforeEach, describe, expect, it, vi } from 'vitest';

const { sendMock } = vi.hoisted(() => ({ sendMock: vi.fn() }));

vi.mock('@aws-sdk/client-sts', () => ({
  STSClient: vi.fn(() => ({ send: sendMock })),
  AssumeRoleWithWebIdentityCommand: vi.fn((input: unknown) => ({ input })),
}));

import { awsBedrockOidcAuth } from './auth';

const mintOidcToken = vi.fn();

const server = {
  apiUrl: 'http://127.0.0.1:4200/api/',
  publicUrl: 'http://127.0.0.1:4200/api/',
  mintOidcToken,
};

describe('awsBedrockOidcAuth.validate', () => {
  beforeEach(() => {
    sendMock.mockReset();
    mintOidcToken.mockReset();
    mintOidcToken.mockResolvedValue('signed-oidc-token');
  });

  it('rejects a malformed role ARN without calling AWS', async () => {
    const result = await awsBedrockOidcAuth.validate?.({
      auth: { roleArn: 'not-an-arn', region: 'us-east-1' },
      server,
    });

    expect(result).toEqual({
      valid: false,
      error: 'Invalid IAM Role ARN format. Expected: arn:aws:iam::123456789012:role/RoleName',
    });
    expect(mintOidcToken).not.toHaveBeenCalled();
    expect(sendMock).not.toHaveBeenCalled();
  });

  it('returns the STS error when the role cannot be assumed', async () => {
    const stsError = new Error('The web identity token provided could not be validated.');
    stsError.name = 'InvalidIdentityToken';
    sendMock.mockRejectedValue(stsError);

    const result = await awsBedrockOidcAuth.validate?.({
      auth: { roleArn: 'arn:aws:iam::123456789012:role/does-not-exist', region: 'us-east-1' },
      server,
    });

    expect(result).toEqual({
      valid: false,
      error: 'InvalidIdentityToken: The web identity token provided could not be validated.',
    });
    expect(sendMock).toHaveBeenCalledTimes(1);
    expect(mintOidcToken).toHaveBeenCalledWith({ audience: 'sts.amazonaws.com' });
    expect(sendMock.mock.calls[0][0].input).toMatchObject({
      RoleArn: 'arn:aws:iam::123456789012:role/does-not-exist',
      WebIdentityToken: 'signed-oidc-token',
    });
  });

  it('returns an error when the platform cannot mint an OIDC token', async () => {
    mintOidcToken.mockRejectedValue(new Error('Failed to get OIDC token: Forbidden'));

    const result = await awsBedrockOidcAuth.validate?.({
      auth: { roleArn: 'arn:aws:iam::123456789012:role/token-endpoint-down', region: 'us-east-1' },
      server,
    });

    expect(result).toEqual({
      valid: false,
      error: 'Failed to get OIDC token: Forbidden',
    });
    expect(sendMock).not.toHaveBeenCalled();
  });

  it('accepts when the role assumption succeeds', async () => {
    sendMock.mockResolvedValue({
      Credentials: {
        AccessKeyId: 'AKIATEST',
        SecretAccessKey: 'secret',
        SessionToken: 'session',
        Expiration: new Date(Date.now() + 3_600_000),
      },
    });

    const result = await awsBedrockOidcAuth.validate?.({
      auth: { roleArn: 'arn:aws:iam::123456789012:role/assumable-role', region: 'us-east-1' },
      server,
    });

    expect(result).toEqual({ valid: true });
  });

  it('rejects a region that is not an AWS region before reaching AWS', async () => {
    const result = await awsBedrockOidcAuth.validate?.({
      auth: { roleArn: 'arn:aws:iam::123456789012:role/valid-shape', region: 'us-east-1.evil.com' },
      server,
    });

    expect(result).toEqual({ valid: false, error: 'Invalid AWS region: us-east-1.evil.com' });
    expect(sendMock).not.toHaveBeenCalled();
  });
});
