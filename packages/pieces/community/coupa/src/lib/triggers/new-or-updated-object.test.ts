import {
  HttpRequest,
  HttpResponse,
  httpClient,
} from '@activepieces/pieces-common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { newOrUpdatedObject } from './new-or-updated-object';

const AUTH = {
  instanceUrl: 'acme.coupahost.com',
  clientId: 'id',
  clientSecret: 'secret',
  scope: 'core.common.read',
};

function resp(body: unknown): HttpResponse {
  return { status: 200, headers: {}, body };
}

function isTokenRequest(request: HttpRequest): boolean {
  return request.url.endsWith('/oauth2/token');
}

function makeStore(initial: Record<string, unknown> = {}) {
  const data: Record<string, unknown> = { ...initial };
  return {
    get: async (key: string) => (key in data ? data[key] : undefined),
    put: async (key: string, value: unknown) => {
      data[key] = value;
      return value;
    },
    delete: async (key: string) => {
      delete data[key];
    },
  };
}

function triggerContext(
  propsValue: Record<string, unknown>,
  store: ReturnType<typeof makeStore>
) {
  return { auth: { props: AUTH }, propsValue, store, files: {} } as never;
}

let sendRequest: ReturnType<typeof vi.spyOn>;

function mockApi(router: (request: HttpRequest) => unknown): void {
  sendRequest.mockImplementation(async (request: HttpRequest) => {
    if (isTokenRequest(request)) {
      return resp({ access_token: 'tok', expires_in: 3600 });
    }
    return resp(router(request));
  });
}

function resourceRequests(): HttpRequest[] {
  return sendRequest.mock.calls
    .map((c) => c[0] as HttpRequest)
    .filter((r) => !isTokenRequest(r));
}

function resourceRequest(): HttpRequest {
  return resourceRequests()[0];
}

beforeEach(() => {
  sendRequest = vi.spyOn(httpClient, 'sendRequest');
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('new_or_updated_object.test', () => {
  it('fetches recent records and returns standardized data', async () => {
    mockApi(() => [
      { id: 1, 'po-number': 'PO-1', status: 'issued', 'updated-at': '2025-06-01T00:00:00Z' },
    ]);
    const store = makeStore();

    const items = (await newOrUpdatedObject.test(
      triggerContext(
        { module: 'purchase_orders', customResource: undefined, additionalFilters: { 'status[in]': 'issued' } },
        store
      )
    )) as Record<string, unknown>[];

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ po_number: 'PO-1', po_status: 'issued' });

    const req = resourceRequest();
    expect(req.url).toBe('https://acme.coupahost.com/api/purchase_orders');
    expect(req.queryParams?.['updated-at[gt]']).toBeDefined();
    expect(req.queryParams?.['limit']).toBe('10');
    expect(req.queryParams?.['status[in]']).toBe('issued');
  });
});

describe('new_or_updated_object.run (polling dedupe)', () => {
  it('returns only records updated after the last poll and advances the cursor', async () => {
    const lastPoll = Date.parse('2025-01-01T00:00:00Z');
    mockApi(() => [
      { id: 2, 'po-number': 'PO-NEW', status: 'issued', 'updated-at': '2025-06-01T00:00:00Z' },
      { id: 3, 'po-number': 'PO-OLD', status: 'issued', 'updated-at': '2024-06-01T00:00:00Z' },
    ]);
    const store = makeStore({ lastPoll });

    const items = (await newOrUpdatedObject.run(
      triggerContext(
        { module: 'purchase_orders', customResource: undefined, additionalFilters: undefined },
        store
      )
    )) as Record<string, unknown>[];

    expect(items).toHaveLength(1);
    expect(items[0]['po_number']).toBe('PO-NEW');

    const advanced = (await store.get('lastPoll')) as number;
    expect(advanced).toBe(Date.parse('2025-06-01T00:00:00Z'));

    expect(resourceRequest().queryParams?.['limit']).toBe('50');
  });

  it('paginates exhaustively so records beyond one page are not dropped', async () => {
    const lastPoll = Date.parse('2025-01-01T00:00:00Z');
    const fullPage = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      'po-number': `PO-${i}`,
      status: 'issued',
      'updated-at': '2025-06-01T00:00:00Z',
    }));
    const overflow = Array.from({ length: 5 }, (_, i) => ({
      id: 50 + i,
      'po-number': `PO-${50 + i}`,
      status: 'issued',
      'updated-at': '2025-06-01T00:00:00Z',
    }));

    mockApi((request) => {
      const offset = Number(request.queryParams?.['offset'] ?? 0);
      return offset === 0 ? fullPage : overflow;
    });
    const store = makeStore({ lastPoll });

    const items = (await newOrUpdatedObject.run(
      triggerContext(
        { module: 'purchase_orders', customResource: undefined, additionalFilters: undefined },
        store
      )
    )) as Record<string, unknown>[];

    expect(items).toHaveLength(55);
    expect(resourceRequests()).toHaveLength(2);
  });
});

describe('new_or_updated_object custom module', () => {
  it('returns raw records without standardizing for a custom resource', async () => {
    mockApi(() => [{ id: 9, foo: 'bar', 'updated-at': '2025-06-01T00:00:00Z' }]);
    const store = makeStore();

    const items = (await newOrUpdatedObject.test(
      triggerContext(
        { module: '__custom__', customResource: 'invoices', additionalFilters: undefined },
        store
      )
    )) as Record<string, unknown>[];

    expect(items[0]).toEqual({ id: 9, foo: 'bar', 'updated-at': '2025-06-01T00:00:00Z' });
    expect(resourceRequest().url).toBe('https://acme.coupahost.com/api/invoices');
  });
});
