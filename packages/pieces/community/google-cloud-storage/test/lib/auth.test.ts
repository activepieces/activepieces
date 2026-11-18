import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PropertyType } from '@activepieces/pieces-framework';

const { googleCloudStorage } = await import('../../src/index');
const { googleCloudStorageOidcAuth } = await import('../../src/lib/common/auth');
const { gcsWorkloadIdentity } = await import('../../src/lib/common/workload-identity');

const fetchMock = vi.fn();
const mintOidcToken = vi.fn();
const SERVER = { apiUrl: 'http://api.local/', publicUrl: 'http://public.local/', mintOidcToken };
const PROPS = { projectNumber: '123456789012', poolId: 'activepieces', providerId: 'activepieces-oidc' };

beforeEach(() => {
  gcsWorkloadIdentity.clearCache();
  fetchMock.mockReset();
  mintOidcToken.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

describe('googleCloudStorage auth', () => {
  it('should offer OAuth2 and Workload Identity Federation (OIDC) connections', () => {
    const auths = Array.isArray(googleCloudStorage.auth) ? googleCloudStorage.auth : [googleCloudStorage.auth];

    expect(auths.map((auth) => auth?.type)).toEqual([PropertyType.OAUTH2, PropertyType.OIDC]);
  });
});

describe('googleCloudStorageOidcAuth.validate', () => {
  it('should be valid when the token minted for validation is accepted by Google STS', async () => {
    mintOidcToken.mockResolvedValue('activepieces-oidc-jwt');
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ access_token: 'federated-token', expires_in: 3599 }), { status: 200 }));

    const result = await googleCloudStorageOidcAuth.validate?.({ auth: PROPS, server: SERVER } as never);

    expect(mintOidcToken).toHaveBeenCalledWith({
      audience: '//iam.googleapis.com/projects/123456789012/locations/global/workloadIdentityPools/activepieces/providers/activepieces-oidc',
    });
    expect(result).toEqual({ valid: true });
  });

  it('should return a readable error when Google STS rejects the provider', async () => {
    mintOidcToken.mockResolvedValue('activepieces-oidc-jwt');
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'invalid_target', error_description: 'The target service indicated by the "audience" parameters is invalid.' }), { status: 400 }),
    );

    const result = await googleCloudStorageOidcAuth.validate?.({ auth: PROPS, server: SERVER } as never);

    expect(result).toEqual({
      valid: false,
      error: 'Google STS rejected the OIDC token: The target service indicated by the "audience" parameters is invalid. Check the pool/provider, issuer URI and attribute condition.',
    });
  });
});
