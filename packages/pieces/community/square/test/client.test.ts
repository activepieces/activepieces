import { HttpMethod } from '@activepieces/pieces-common';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { squareClient, SquareApiError } from '../src/lib/common/client';
import { connection, stubFetch, TOKEN } from './helpers';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('squareClient.request', () => {
  test('sends bearer token, pinned Square-Version and JSON to the production host', async () => {
    const seen = stubFetch(() => ({ body: { ok: true } }));
    await squareClient.request({ auth: connection(), method: HttpMethod.POST, path: ['v2', 'customers', 'search'], body: { limit: 1 }, operation: 'x' });
    expect(seen[0].url).toBe('https://connect.squareup.com/v2/customers/search');
    expect(seen[0].headers.get('authorization')).toBe(`Bearer ${TOKEN}`);
    expect(seen[0].headers.get('square-version')).toBe('2026-09-16');
    expect(seen[0].headers.get('accept')).toBe('application/json');
    expect(seen[0].json).toEqual({ limit: 1 });
  });

  test('encodes id segments and refuses path tricks before any request', async () => {
    const seen = stubFetch(() => ({ body: {} }));
    await squareClient.request({ auth: connection(), method: HttpMethod.GET, path: ['v2', 'catalog', 'object', 'obj:0-abc'], operation: 'x' });
    expect(seen[0].path).toBe('/v2/catalog/object/obj%3A0-abc');
    await expect(squareClient.request({ auth: connection(), method: HttpMethod.GET, path: ['v2', 'orders', '../merchants/me'], operation: 'x' })).rejects.toThrow('not valid');
    expect(seen).toHaveLength(1);
  });

  test('maps INSUFFICIENT_SCOPES to a reconnect message naming the scope', async () => {
    stubFetch(() => ({
      status: 403,
      body: {
        errors: [
          {
            category: 'AUTHENTICATION_ERROR',
            code: 'INSUFFICIENT_SCOPES',
            detail: 'The merchant has not given your application sufficient permissions to do that. The merchant must authorize your application for the following scopes: INVENTORY_READ',
          },
        ],
      },
    }));
    const error = await squareClient.request({ auth: connection(), method: HttpMethod.GET, path: ['v2', 'x'], operation: 'read inventory counts' }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(SquareApiError);
    expect(String(Reflect.get(Object(error), 'message'))).toContain('missing the Square permission INVENTORY_READ. Reconnect your Square connection');
    expect(Reflect.get(Object(error), 'body')).toBeUndefined();
    expect(Reflect.get(Object(error), 'responseBody')).toBeDefined();
  });

  test('explains 401 and 404', async () => {
    stubFetch((request) => {
      if (request.path.endsWith('expired')) {
        return { status: 401, body: { errors: [{ code: 'ACCESS_TOKEN_EXPIRED', detail: 'expired' }] } };
      }
      return { status: 404, body: { errors: [{ code: 'NOT_FOUND', detail: 'Could not find payment' }] } };
    });
    await expect(squareClient.request({ auth: connection(), method: HttpMethod.GET, path: ['v2', 'expired'], operation: 'x' })).rejects.toThrow('expired or was revoked');
    await expect(squareClient.request({ auth: connection(), method: HttpMethod.GET, path: ['v2', 'payments', 'P1'], operation: 'x' })).rejects.toThrow('not found');
  });

  test('retries a 429 and then succeeds', async () => {
    const seen = stubFetch((_request, index) => (index === 0 ? { status: 429, body: { errors: [{ code: 'RATE_LIMITED' }] } } : { body: { ok: 1 } }));
    const result = await squareClient.request<{ ok: number }>({ auth: connection(), method: HttpMethod.GET, path: ['v2', 'locations'], operation: 'x' });
    expect(result.ok).toBe(1);
    expect(seen).toHaveLength(2);
  });
});
