import { beforeEach, describe, expect, it, vi } from 'vitest';

const mintServiceAccountToken = vi.fn<() => Promise<string>>();

vi.mock('../../../src/lib/common/service-account', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../src/lib/common/service-account')>();
  return { ...actual, mintServiceAccountToken };
});

const { resolveAuth } = await import('../../../src/lib/common/token');
const { googleWorkspaceScopes } = await import('../../../src/lib/auth');

type AnyAuth = Parameters<typeof resolveAuth>[0];

describe('resolveAuth()', () => {
  beforeEach(() => {
    mintServiceAccountToken.mockReset();
  });

  it('should use the access token of an OAuth2 connection as is', async () => {
    const auth = { type: 'OAUTH2', access_token: 'ya29.oauth', data: {} } as unknown as AnyAuth;

    await expect(resolveAuth(auth)).resolves.toEqual({ access_token: 'ya29.oauth' });
    expect(mintServiceAccountToken).not.toHaveBeenCalled();
  });

  it('should mint a token for a service account connection with every piece scope', async () => {
    mintServiceAccountToken.mockResolvedValue('ya29.minted');
    const props = { clientEmail: 'bot@p.iam.gserviceaccount.com', privateKey: 'pem', adminEmail: 'admin@example.com' };
    const auth = { type: 'CUSTOM_AUTH', props } as unknown as AnyAuth;

    await expect(resolveAuth(auth)).resolves.toEqual({ access_token: 'ya29.minted' });
    expect(mintServiceAccountToken).toHaveBeenCalledWith({ creds: props, scopes: googleWorkspaceScopes });
  });

  it('should ask for a connection when there is none', async () => {
    await expect(resolveAuth(undefined)).rejects.toThrow('A Google Workspace connection is required.');
  });

  it('should ask to reconnect an OAuth2 connection without a token', async () => {
    const auth = { type: 'CLOUD_OAUTH2', access_token: '', data: {} } as unknown as AnyAuth;

    await expect(resolveAuth(auth)).rejects.toThrow('reconnect it');
  });
});
