import { afterEach, describe, expect, it, vi } from 'vitest';
import { httpClient } from '@activepieces/pieces-common';
import { quickbooksAuth } from './auth';

const server = { apiUrl: 'http://127.0.0.1:4200/api/', publicUrl: 'http://127.0.0.1:4200/api/' };

function resolveIdentifier(companyId: unknown) {
  return quickbooksAuth.getConnectionIdentifier?.({ auth: { access_token: 'token', data: {}, props: { companyId } }, server });
}

function mockCompanyInfo(body: unknown) {
  return vi.spyOn(httpClient, 'sendRequest').mockResolvedValue({ status: 200, headers: {}, body });
}

describe('quickbooksAuth.getConnectionIdentifier', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns the company name for the connected company', async () => {
    const sendRequest = mockCompanyInfo({ CompanyInfo: { CompanyName: 'Acme Ltd', Email: { Address: 'books@acme.test' } } });

    expect(await resolveIdentifier(' 123 ')).toBe('Acme Ltd');
    expect(sendRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'https://quickbooks.api.intuit.com/v3/company/123/companyinfo/123',
        queryParams: { minorversion: '75' },
        headers: { Authorization: 'Bearer token', Accept: 'application/json' },
      }),
    );
  });

  it('falls back to the legal name, then the company email', async () => {
    mockCompanyInfo({ CompanyInfo: { LegalName: 'Acme Holdings LLC', Email: { Address: 'books@acme.test' } } });
    expect(await resolveIdentifier('123')).toBe('Acme Holdings LLC');

    mockCompanyInfo({ CompanyInfo: { Email: { Address: 'books@acme.test' } } });
    expect(await resolveIdentifier('123')).toBe('books@acme.test');
  });

  it('makes no request when the connection has no company ID', async () => {
    const sendRequest = mockCompanyInfo({});

    expect(await resolveIdentifier('')).toBeUndefined();
    expect(await resolveIdentifier(undefined)).toBeUndefined();
    expect(sendRequest).not.toHaveBeenCalled();
  });

  it('returns undefined instead of throwing when the API call fails', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockRejectedValue(new Error('403 Forbidden'));

    expect(await resolveIdentifier('123')).toBeUndefined();
  });
});
