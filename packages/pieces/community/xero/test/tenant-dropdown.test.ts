import { afterEach, describe, expect, it, vi } from 'vitest';
import '../src';
import { buildTenantOptions, props } from '../src/lib/common/props';
import { oauthAuth, requestedHeaders, requestedUrl, stubFetch } from './helpers';

const ctx = { searchValue: undefined, server: { apiUrl: '', publicUrl: '', token: '' }, project: { id: 'p', externalId: async () => undefined } };

function loadTenantOptions() {
  return Reflect.apply(props.tenant_id.options, props.tenant_id, [{ auth: oauthAuth() }, ctx]);
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Organization dropdown', () => {
  it('lists every connected tenant, organisations first, values are tenant IDs', async () => {
    const fetchMock = stubFetch({
      status: 200,
      body: [
        { id: 'c1', tenantId: 'practice-1', tenantType: 'PRACTICE', tenantName: 'My Practice' },
        { id: 'c2', tenantId: 'org-1', tenantType: 'ORGANISATION', tenantName: 'Demo Company (Global)' },
        { id: 'c3', tenantId: 'org-2', tenantType: 'ORGANISATION', tenantName: 'Second Org' },
      ],
    });

    const result = await loadTenantOptions();

    expect(requestedUrl({ fetchMock })).toBe('https://api.xero.com/connections');
    expect(requestedHeaders({ fetchMock }).get('authorization')).toBe('Bearer tok_test');
    expect(result).toEqual({
      disabled: false,
      options: [
        { label: 'Demo Company (Global)', value: 'org-1' },
        { label: 'Second Org', value: 'org-2' },
        { label: 'My Practice (PRACTICE)', value: 'practice-1' },
      ],
    });
  });

  it('returns a disabled placeholder instead of crashing when no tenant is connected', async () => {
    stubFetch({ status: 200, body: [] });

    const result = await loadTenantOptions();

    expect(result).toEqual({
      disabled: true,
      options: [],
      placeholder: 'No Xero organizations are connected. Reconnect and select at least one organization.',
    });
  });

  it('returns a disabled placeholder with the status when Xero rejects the token', async () => {
    stubFetch({ status: 401, body: { title: 'Unauthorized' } });

    const result = await loadTenantOptions();

    expect(result).toMatchObject({ disabled: true, options: [] });
    expect(JSON.stringify(result)).toContain('HTTP 401');
  });

  it('asks to authenticate when there is no connection', async () => {
    const result = await Reflect.apply(props.tenant_id.options, props.tenant_id, [{ auth: undefined }, ctx]);

    expect(result).toEqual({ disabled: true, options: [], placeholder: 'Please authenticate first' });
  });

  it('falls back to the tenant ID when the tenant has no name and skips entries without an ID', () => {
    expect(
      buildTenantOptions({
        connections: [
          { id: 'c1', tenantId: 'org-1', tenantType: 'ORGANISATION', tenantName: null },
          { id: 'c2', tenantId: '', tenantType: 'ORGANISATION', tenantName: 'Broken' },
        ],
      }),
    ).toEqual({ disabled: false, options: [{ label: 'org-1', value: 'org-1' }] });
  });

  it('treats a missing body as no tenants', () => {
    expect(buildTenantOptions({ connections: null })).toMatchObject({ disabled: true, options: [] });
  });
});
