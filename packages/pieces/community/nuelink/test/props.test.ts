import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nuelinkProps } from '../src/lib/common/props';
import { BRAND, apiKeyAuth, installFetch, jsonResponse, legacyAuth, listBody, requestOf } from './helpers';

let fetchMock: ReturnType<typeof installFetch>;

beforeEach(() => {
  fetchMock = installFetch();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function options({ property, params }: { property: { options: unknown }; params: Record<string, unknown> }): Promise<unknown> {
  const fn = property.options;
  if (typeof fn !== 'function') {
    throw new Error('not a dynamic dropdown');
  }
  return Reflect.apply(fn, property, [params, {}]);
}

describe('dropdowns', () => {
  it('Brand walks every page', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ body: listBody({ data: [BRAND], currentPage: 1, lastPage: 2 }) }))
      .mockResolvedValueOnce(jsonResponse({ body: listBody({ data: [{ ...BRAND, id: 43, title: 'Beta', timezone: null }], currentPage: 2, lastPage: 2 }) }));
    const result = await options({ property: nuelinkProps.brand(), params: { auth: apiKeyAuth() } });
    expect(result).toEqual({
      disabled: false,
      options: [
        { label: 'Acme Marketing (Europe/London)', value: 42 },
        { label: 'Beta', value: 43 },
      ],
      placeholder: undefined,
    });
  });

  it('Collection needs a brand and lists channel counts', async () => {
    expect(await options({ property: nuelinkProps.collection({ required: true, description: '' }), params: { auth: apiKeyAuth(), brand: undefined } })).toMatchObject({ disabled: true, placeholder: 'Select a brand first.' });
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ body: listBody({ data: [{ id: 77, title: 'AP Test – no channels', status: 'ACTIVE', channels: [] }, { id: 78, title: 'Main', status: 'PAUSED', channels: [{ id: 1 }] }] }) })
    );
    const result = await options({ property: nuelinkProps.collection({ required: true, description: '' }), params: { auth: apiKeyAuth(), brand: 42 } });
    expect(result).toMatchObject({
      options: [
        { label: 'AP Test – no channels (0 channels)', value: 77 },
        { label: 'Main (1 channel, paused)', value: 78 },
      ],
    });
    expect(requestOf({ fetchMock, call: 0 }).url).toBe('https://app.nuelink.com/api/public/v1/brands/42/collections?page=1&per_page=100');
  });

  it('Channel keeps walking past short and empty pages', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ body: listBody({ data: [], currentPage: 1, lastPage: 2, total: 3 }) }))
      .mockResolvedValueOnce(jsonResponse({ body: listBody({ data: [{ id: 501, name: 'Acme on LinkedIn', type: 'LinkedIn' }], currentPage: 2, lastPage: 2 }) }));
    const result = await options({ property: nuelinkProps.channel(), params: { auth: apiKeyAuth(), brand: 42 } });
    expect(result).toMatchObject({ options: [{ label: 'Acme on LinkedIn (LinkedIn)', value: 501 }] });
  });

  it('legacy token and errors give a disabled dropdown with a reason', async () => {
    expect(await options({ property: nuelinkProps.brand(), params: { auth: legacyAuth() } })).toMatchObject({ disabled: true, placeholder: expect.stringContaining('API Key connection') });
    expect(await options({ property: nuelinkProps.brand(), params: { auth: undefined } })).toMatchObject({ disabled: true });
    fetchMock.mockResolvedValueOnce(jsonResponse({ status: 401, body: { status: 'error', message: 'Token has expired', errors: { authorization: 'Token has expired' } } }));
    expect(await options({ property: nuelinkProps.brand(), params: { auth: apiKeyAuth() } })).toMatchObject({ disabled: true, placeholder: expect.stringContaining('(401)') });
  });
});
