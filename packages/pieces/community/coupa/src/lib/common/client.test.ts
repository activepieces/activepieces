import {
  HttpMethod,
  HttpRequest,
  HttpResponse,
  httpClient,
} from '@activepieces/pieces-common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CoupaClient } from './client';

const AUTH = {
  instanceUrl: 'https://acme.coupahost.com/',
  clientId: 'id-123',
  clientSecret: 'secret-456',
  scope: 'core.common.read',
};

function resp(body: unknown): HttpResponse {
  return { status: 200, headers: {}, body };
}

function isTokenRequest(request: HttpRequest): boolean {
  return request.url.endsWith('/oauth2/token');
}

let sendRequest: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  sendRequest = vi.spyOn(httpClient, 'sendRequest');
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('CoupaClient.getAccessToken', () => {
  it('posts client_credentials to the token endpoint of the normalized host', async () => {
    sendRequest.mockResolvedValue(resp({ access_token: 'tok', expires_in: 3600 }));

    const client = new CoupaClient(AUTH);
    const token = await client.getAccessToken();

    expect(token).toBe('tok');
    const req = sendRequest.mock.calls[0][0] as HttpRequest;
    expect(req.method).toBe(HttpMethod.POST);
    expect(req.url).toBe('https://acme.coupahost.com/oauth2/token');
    const params = req.body as URLSearchParams;
    expect(params.get('grant_type')).toBe('client_credentials');
    expect(params.get('client_id')).toBe('id-123');
    expect(params.get('client_secret')).toBe('secret-456');
    expect(params.get('scope')).toBe('core.common.read');
  });

  it('caches the token across calls (only one token request)', async () => {
    sendRequest.mockResolvedValue(resp({ access_token: 'tok', expires_in: 3600 }));

    const client = new CoupaClient(AUTH);
    await client.getAccessToken();
    await client.getAccessToken();

    const tokenCalls = sendRequest.mock.calls.filter((c) =>
      isTokenRequest(c[0] as HttpRequest)
    );
    expect(tokenCalls).toHaveLength(1);
  });
});

describe('CoupaClient.request', () => {
  beforeEach(() => {
    sendRequest.mockImplementation(async (request: HttpRequest) => {
      if (isTokenRequest(request)) {
        return resp({ access_token: 'tok', expires_in: 3600 });
      }
      return resp({ id: 1, name: 'Acme' });
    });
  });

  it('builds the URL, bearer header, and stringified query params', async () => {
    const client = new CoupaClient(AUTH);
    const body = await client.request<Record<string, unknown>>({
      method: HttpMethod.GET,
      resourceUri: 'suppliers',
      query: { limit: 50, exported: false, skip: undefined },
    });

    expect(body).toEqual({ id: 1, name: 'Acme' });
    const resourceReq = sendRequest.mock.calls
      .map((c) => c[0] as HttpRequest)
      .find((r) => !isTokenRequest(r));
    expect(resourceReq?.url).toBe('https://acme.coupahost.com/api/suppliers');
    expect(resourceReq?.headers?.['Authorization']).toBe('Bearer tok');
    expect(resourceReq?.queryParams).toEqual({ limit: '50', exported: 'false' });
  });

  it('wraps API errors with formatCoupaError', async () => {
    sendRequest.mockImplementation(async (request: HttpRequest) => {
      if (isTokenRequest(request)) {
        return resp({ access_token: 'tok', expires_in: 3600 });
      }
      throw { response: { status: 422, body: { error: 'invalid' } } };
    });

    const client = new CoupaClient(AUTH);
    await expect(
      client.request({ method: HttpMethod.GET, resourceUri: '/suppliers' })
    ).rejects.toThrow('Coupa API error (422): {"error":"invalid"}');
  });
});

describe('CoupaClient.fetchAllRecords', () => {
  it('paginates until a short page is returned', async () => {
    const firstPage = Array.from({ length: 50 }, (_, i) => ({ id: i }));
    const secondPage = [{ id: 50 }, { id: 51 }];

    sendRequest.mockImplementation(async (request: HttpRequest) => {
      if (isTokenRequest(request)) {
        return resp({ access_token: 'tok', expires_in: 3600 });
      }
      const offset = Number(request.queryParams?.['offset'] ?? 0);
      return resp(offset === 0 ? firstPage : secondPage);
    });

    const client = new CoupaClient(AUTH);
    const all = await client.fetchAllRecords('purchase_orders');

    expect(all).toHaveLength(52);
    const resourceReqs = sendRequest.mock.calls
      .map((c) => c[0] as HttpRequest)
      .filter((r) => !isTokenRequest(r));
    expect(resourceReqs).toHaveLength(2);
    expect(resourceReqs[0].queryParams).toMatchObject({ limit: '50', offset: '0' });
    expect(resourceReqs[1].queryParams).toMatchObject({ offset: '50' });
  });

  it('stops immediately on an empty first page', async () => {
    sendRequest.mockImplementation(async (request: HttpRequest) => {
      if (isTokenRequest(request)) {
        return resp({ access_token: 'tok', expires_in: 3600 });
      }
      return resp([]);
    });

    const client = new CoupaClient(AUTH);
    const all = await client.fetchAllRecords('suppliers');
    expect(all).toEqual([]);
  });
});
