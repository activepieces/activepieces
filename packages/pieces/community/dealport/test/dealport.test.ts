import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { dealport } from '../src/index';
import {
  DEALPORT_BASE_URL,
  assertDealportUrl,
  assertValidCompanyUuid,
  assertValidRecordId,
  assertValidState,
  splitCsvList,
} from '../src/lib/common/client';

const TEST_UUID = '123e4567-e89b-12d3-a456-426614174000';

describe('dealport piece', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('registers all 8 expected actions', () => {
    const actionNames = Object.keys(dealport.actions());
    expect(actionNames).toEqual([
      'preview-companies',
      'search-companies',
      'search-buildings',
      'get-record',
      'find-owner',
      'find-contact',
      'match-company-list',
      'custom_api_call',
    ]);
  });

  it('validates input helpers and custom API call host boundary', () => {
    expect(splitCsvList('238220, 332710')).toEqual(['238220', '332710']);
    expect(assertValidState('oh')).toBe('OH');
    expect(() => assertValidState('OHIO')).toThrow();
    expect(assertValidRecordId(TEST_UUID)).toBe(TEST_UUID);
    expect(() => assertValidRecordId('../balance')).toThrow();
    expect(assertValidCompanyUuid(TEST_UUID)).toBe(TEST_UUID);
    expect(() => assertValidCompanyUuid('not-a-uuid')).toThrow();
    expect(() => assertDealportUrl('/balance')).not.toThrow();
    expect(() => assertDealportUrl(`${DEALPORT_BASE_URL}/balance`)).not.toThrow();
    expect(() => assertDealportUrl('https://evil.example.com/steal')).toThrow();
  });

  it('sends authenticated requests for preview, search, record, owner, contact, and match actions', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue({
      status: 200,
      headers: {},
      body: { ok: true },
    });

    const auth = { secret_text: 'dp_live_test_key' } as never;
    const actions = dealport.actions();

    await actions['preview-companies'].run({
      auth,
      propsValue: { state: 'oh', naics: '238220, 332710', independent: true },
    } as never);
    expect(spy).toHaveBeenLastCalledWith(
      expect.objectContaining({
        method: HttpMethod.POST,
        url: `${DEALPORT_BASE_URL}/companies/preview`,
        body: { state: 'OH', naics: ['238220', '332710'], independent: true },
      })
    );

    await actions['search-companies'].run({
      auth,
      propsValue: { state: 'tx', limit: 10 },
    } as never);
    expect(spy).toHaveBeenLastCalledWith(
      expect.objectContaining({
        method: HttpMethod.GET,
        url: `${DEALPORT_BASE_URL}/companies`,
        queryParams: { state: 'TX', limit: '10' },
      })
    );

    await actions['search-buildings'].run({
      auth,
      propsValue: { borough: 'MN', min_units: 20, limit: 15 },
    } as never);
    expect(spy).toHaveBeenLastCalledWith(
      expect.objectContaining({
        method: HttpMethod.GET,
        url: `${DEALPORT_BASE_URL}/buildings`,
        queryParams: { borough: 'MN', min_units: '20', limit: '15' },
      })
    );

    await actions['get-record'].run({
      auth,
      propsValue: { record_id: TEST_UUID },
    } as never);
    expect(spy).toHaveBeenLastCalledWith(
      expect.objectContaining({
        method: HttpMethod.GET,
        url: `${DEALPORT_BASE_URL}/records/${TEST_UUID}`,
      })
    );

    await actions['find-owner'].run({
      auth,
      propsValue: { company_id: TEST_UUID, person: 'Jane Doe' },
    } as never);
    expect(spy).toHaveBeenLastCalledWith(
      expect.objectContaining({
        method: HttpMethod.POST,
        url: `${DEALPORT_BASE_URL}/owners`,
        body: { company_id: TEST_UUID, person: 'Jane Doe' },
      })
    );

    await actions['find-contact'].run({
      auth,
      propsValue: { company_id: TEST_UUID },
    } as never);
    expect(spy).toHaveBeenLastCalledWith(
      expect.objectContaining({
        method: HttpMethod.POST,
        url: `${DEALPORT_BASE_URL}/contacts`,
        body: { company_id: TEST_UUID },
      })
    );

    await actions['match-company-list'].run({
      auth,
      propsValue: { items_json: JSON.stringify([{ name: 'Acme LLC', state: 'OH' }]) },
    } as never);
    expect(spy).toHaveBeenLastCalledWith(
      expect.objectContaining({
        method: HttpMethod.POST,
        url: `${DEALPORT_BASE_URL}/companies/match`,
        body: { items: [{ name: 'Acme LLC', state: 'OH' }], watch: false },
      })
    );
  });
});
