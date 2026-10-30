import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppConnectionType } from '@activepieces/pieces-framework';

const { gcsCommon } = await import('../../../src/lib/common/client');
const { gcsWorkloadIdentity } = await import('../../../src/lib/common/workload-identity');
const { searchBuckets } = await import('../../../src/lib/actions/search-buckets');

const makeRequest = vi.spyOn(gcsCommon, 'makeRequest');
const fetchMock = vi.fn();

const SERVER = { apiUrl: 'http://api.local/', publicUrl: 'http://public.local/', token: 'engine-token' };
const OIDC_PROPS = { projectNumber: '123456789012', poolId: 'activepieces', providerId: 'activepieces-oidc' };
const AUDIENCE =
  '//iam.googleapis.com/projects/123456789012/locations/global/workloadIdentityPools/activepieces/providers/activepieces-oidc';
const SERVICE_ACCOUNT = 'gcs-bot@my-project.iam.gserviceaccount.com';

const oauth2 = { type: AppConnectionType.OAUTH2, access_token: 'oauth-token' };
const oidc = (props: Record<string, unknown> = OIDC_PROPS) => ({ type: AppConnectionType.OIDC, props });
const ctx = (auth: unknown) => ({ auth, server: SERVER, propsValue: { projectId: 'my-project' } }) as never;

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

function mockTokenChain({ expiresIn = 3599, impersonation }: { expiresIn?: number; impersonation?: Response } = {}) {
  fetchMock
    .mockResolvedValueOnce(jsonResponse(200, { token: 'activepieces-oidc-jwt' }))
    .mockResolvedValueOnce(jsonResponse(200, { access_token: 'federated-token', expires_in: expiresIn }));
  if (impersonation) {
    fetchMock.mockResolvedValueOnce(impersonation);
  }
}

beforeEach(() => {
  gcsWorkloadIdentity.clearCache();
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
  makeRequest.mockReset();
  makeRequest.mockResolvedValue({ items: [{ name: 'bucket-a' }] });
});

describe('searchBuckets with an OAuth2 connection', () => {
  it('should use the stored access token without any token exchange', async () => {
    const output = await searchBuckets.run(ctx(oauth2));

    expect(makeRequest).toHaveBeenCalledWith('GET', '/b?project=my-project', 'oauth-token');
    expect(fetchMock).not.toHaveBeenCalled();
    expect(output).toMatchObject({ success: true, totalBuckets: 1 });
  });
});

describe('searchBuckets with a Workload Identity Federation (OIDC) connection', () => {
  it('should mint an Activepieces OIDC token, exchange it at Google STS and call Storage with the federated token', async () => {
    mockTokenChain();

    await searchBuckets.run(ctx(oidc()));

    const [oidcUrl, oidcInit] = fetchMock.mock.calls[0];
    expect(oidcUrl).toBe('http://api.local/v1/worker/oidc-token');
    expect(oidcInit.headers.Authorization).toBe('Bearer engine-token');
    expect(JSON.parse(oidcInit.body)).toEqual({ audience: AUDIENCE });

    const [stsUrl, stsInit] = fetchMock.mock.calls[1];
    expect(stsUrl).toBe('https://sts.googleapis.com/v1/token');
    expect(JSON.parse(stsInit.body)).toEqual({
      grantType: 'urn:ietf:params:oauth:grant-type:token-exchange',
      audience: AUDIENCE,
      scope: 'https://www.googleapis.com/auth/cloud-platform',
      requestedTokenType: 'urn:ietf:params:oauth:token-type:access_token',
      subjectTokenType: 'urn:ietf:params:oauth:token-type:jwt',
      subjectToken: 'activepieces-oidc-jwt',
    });
    expect(makeRequest).toHaveBeenCalledWith('GET', '/b?project=my-project', 'federated-token');
  });

  it('should impersonate the configured service account and use its access token', async () => {
    mockTokenChain({
      impersonation: jsonResponse(200, { accessToken: 'sa-token', expireTime: new Date(Date.now() + 3_600_000).toISOString() }),
    });

    await searchBuckets.run(ctx(oidc({ ...OIDC_PROPS, serviceAccountEmail: SERVICE_ACCOUNT })));

    const [url, init] = fetchMock.mock.calls[2];
    expect(url).toBe(
      'https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/gcs-bot%40my-project.iam.gserviceaccount.com:generateAccessToken',
    );
    expect(init.headers.Authorization).toBe('Bearer federated-token');
    expect(makeRequest).toHaveBeenCalledWith('GET', '/b?project=my-project', 'sa-token');
  });

  it('should reuse the cached access token on the next run of the same flow run', async () => {
    mockTokenChain();

    await searchBuckets.run(ctx(oidc()));
    await searchBuckets.run(ctx(oidc()));

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(makeRequest).toHaveBeenLastCalledWith('GET', '/b?project=my-project', 'federated-token');
  });

  it('should exchange a new token when the cached one is about to expire', async () => {
    mockTokenChain({ expiresIn: 60 });
    fetchMock
      .mockResolvedValueOnce(jsonResponse(200, { token: 'activepieces-oidc-jwt-2' }))
      .mockResolvedValueOnce(jsonResponse(200, { access_token: 'fresh-token', expires_in: 3599 }));

    await searchBuckets.run(ctx(oidc()));
    await searchBuckets.run(ctx(oidc()));

    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(makeRequest).toHaveBeenLastCalledWith('GET', '/b?project=my-project', 'fresh-token');
  });

  it('should surface the Google STS error without leaking the subject token', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(200, { token: 'secret-oidc-jwt' }))
      .mockResolvedValueOnce(
        jsonResponse(400, { error: 'invalid_grant', error_description: 'The given credential is rejected by the attribute condition.' }),
      );

    const error = await searchBuckets.run(ctx(oidc())).catch((e: Error) => e);

    expect((error as Error).message).toContain('rejected by the attribute condition. Check');
    expect((error as Error).message).not.toContain('secret-oidc-jwt');
    expect(makeRequest).not.toHaveBeenCalled();
  });

  it('should hint at the workloadIdentityUser binding only when the impersonation is denied', async () => {
    const props = { ...OIDC_PROPS, serviceAccountEmail: SERVICE_ACCOUNT };
    mockTokenChain({ impersonation: jsonResponse(403, { error: { message: "Permission 'iam.serviceAccounts.getAccessToken' denied." } }) });
    const denied = await searchBuckets.run(ctx(oidc(props))).catch((e: Error) => e);

    gcsWorkloadIdentity.clearCache();
    mockTokenChain({
      impersonation: jsonResponse(403, {
        error: { message: 'IAM Service Account Credentials API has not been used in project 1 before or it is disabled.', details: [{ reason: 'SERVICE_DISABLED' }] },
      }),
    });
    const disabled = await searchBuckets.run(ctx(oidc(props))).catch((e: Error) => e);

    expect((denied as Error).message).toContain('Grant roles/iam.workloadIdentityUser');
    expect((disabled as Error).message).toContain('API has not been used');
    expect((disabled as Error).message).not.toContain('Grant roles/iam.workloadIdentityUser');
  });

  it('should reject a project ID used as project number before calling anything', async () => {
    await expect(searchBuckets.run(ctx(oidc({ ...OIDC_PROPS, projectNumber: 'my-project' })))).rejects.toThrow(
      'Project Number must be the numeric project number',
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('should reject an invalid service account email before calling anything', async () => {
    await expect(searchBuckets.run(ctx(oidc({ ...OIDC_PROPS, serviceAccountEmail: 'someone@gmail.com' })))).rejects.toThrow(
      'Service Account Email is invalid',
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
