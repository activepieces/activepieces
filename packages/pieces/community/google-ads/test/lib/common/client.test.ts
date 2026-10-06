import { beforeEach, describe, expect, it, vi } from 'vitest';

const { sendRequest } = vi.hoisted(() => ({
  sendRequest: vi.fn<() => Promise<{ body: unknown }>>(),
}));

vi.mock('@activepieces/pieces-common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@activepieces/pieces-common')>();
  return { ...actual, httpClient: { sendRequest } };
});

const { HttpError } = await import('@activepieces/pieces-common');
const { API_VERSION, GoogleAdsApi, GoogleAdsApiError, assertGaql, normalizeCustomerId } = await import('../../../src/lib/common/client');

const TOKEN = 'ya29.test-token';
const AUTH = { access_token: TOKEN };
const AUTH_WITH_MANAGER = { access_token: TOKEN, props: { loginCustomerId: '999-888-7777' } };
const BASE = `https://googleads.googleapis.com/${API_VERSION}`;

function httpError(status: number, data: unknown): HttpError {
  return new HttpError({}, { status, responseBody: data });
}

describe('normalizeCustomerId()', () => {
  it('should accept digits, dashed ids and resource names', () => {
    expect(normalizeCustomerId('1234567890')).toBe('1234567890');
    expect(normalizeCustomerId('123-456-7890')).toBe('1234567890');
    expect(normalizeCustomerId(' customers/1234567890 ')).toBe('1234567890');
  });

  it('should reject anything that is not 10 digits', () => {
    expect(() => normalizeCustomerId('12345')).toThrow('expected 10 digits');
    expect(() => normalizeCustomerId('abc')).toThrow('Invalid Google Ads customer ID');
  });
});

describe('assertGaql()', () => {
  it('should accept a SELECT statement, trimmed', () => {
    expect(assertGaql('  select campaign.id FROM campaign ')).toBe('select campaign.id FROM campaign');
  });

  it('should refuse anything else', () => {
    expect(() => assertGaql('DELETE FROM campaign')).toThrow('must be a GAQL SELECT statement');
  });
});

describe('GoogleAdsApi', () => {
  beforeEach(() => {
    sendRequest.mockReset();
  });

  describe('listAccessibleCustomers()', () => {
    it('should GET without a manager header and strip the resource prefix', async () => {
      sendRequest.mockResolvedValue({ body: { resourceNames: ['customers/1111111111', 'customers/2222222222'] } });

      const ids = await GoogleAdsApi.listAccessibleCustomers(AUTH);

      expect(ids).toEqual(['1111111111', '2222222222']);
      expect(sendRequest).toHaveBeenCalledWith({
        method: 'GET',
        url: `${BASE}/customers:listAccessibleCustomers`,
        headers: {},
        authentication: { type: 'BEARER_TOKEN', token: TOKEN },
      });
    });
  });

  describe('search()', () => {
    it('should POST the query to the versioned customer endpoint with the bearer token', async () => {
      sendRequest.mockResolvedValue({ body: { results: [{ campaign: { id: '1' } }] } });

      const page = await GoogleAdsApi.search({ auth: AUTH, customerId: '123-456-7890', query: 'SELECT campaign.id FROM campaign' });

      expect(page.results).toEqual([{ campaign: { id: '1' } }]);
      expect(sendRequest).toHaveBeenCalledWith({
        method: 'POST',
        url: `${BASE}/customers/1234567890/googleAds:search`,
        headers: {},
        body: { query: 'SELECT campaign.id FROM campaign' },
        authentication: { type: 'BEARER_TOKEN', token: TOKEN },
      });
    });

    it('should send the normalized login-customer-id header when the connection has a manager', async () => {
      sendRequest.mockResolvedValue({ body: {} });

      await GoogleAdsApi.search({
        auth: AUTH_WITH_MANAGER,
        customerId: '1234567890',
        query: 'SELECT campaign.id FROM campaign',
        pageToken: 'tok',
      });

      expect(sendRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: { 'login-customer-id': '9998887777' },
          body: { query: 'SELECT campaign.id FROM campaign', pageToken: 'tok' },
        })
      );
    });

    it('should refuse a non-SELECT query before calling Google', async () => {
      await expect(GoogleAdsApi.search({ auth: AUTH, customerId: '1234567890', query: 'UPDATE campaign SET x = 1' })).rejects.toThrow(
        'GAQL SELECT'
      );
      expect(sendRequest).not.toHaveBeenCalled();
    });
  });

  describe('searchAll()', () => {
    it('should follow nextPageToken until exhausted', async () => {
      sendRequest
        .mockResolvedValueOnce({ body: { results: [{ n: 1 }, { n: 2 }], nextPageToken: 'p2' } })
        .mockResolvedValueOnce({ body: { results: [{ n: 3 }] } });

      const { results, truncated } = await GoogleAdsApi.searchAll({ auth: AUTH, customerId: '1234567890', query: 'SELECT x FROM y' });

      expect(results).toEqual([{ n: 1 }, { n: 2 }, { n: 3 }]);
      expect(truncated).toBe(false);
      expect(sendRequest).toHaveBeenCalledTimes(2);
      expect(sendRequest).toHaveBeenLastCalledWith(expect.objectContaining({ body: { query: 'SELECT x FROM y', pageToken: 'p2' } }));
    });

    it('should stop at maxRows and report truncation', async () => {
      sendRequest.mockResolvedValueOnce({ body: { results: [{ n: 1 }, { n: 2 }, { n: 3 }], nextPageToken: 'p2' } });

      const { results, truncated } = await GoogleAdsApi.searchAll({ auth: AUTH, customerId: '1234567890', query: 'SELECT x FROM y', maxRows: 2 });

      expect(results).toEqual([{ n: 1 }, { n: 2 }]);
      expect(truncated).toBe(true);
      expect(sendRequest).toHaveBeenCalledTimes(1);
    });
  });

  describe('listCustomerClients()', () => {
    function clientRows({ from, count }: { from: number; count: number }) {
      return Array.from({ length: count }, (_, i) => ({ customerClient: { id: String(1_000_000_000 + from + i), status: 'ENABLED' } }));
    }

    it('should filter out non-enabled accounts in the query, keep the ordering and map the rows', async () => {
      sendRequest.mockResolvedValueOnce({
        body: { results: [{ customerClient: { id: '1111111111', descriptiveName: 'Client A', manager: false, testAccount: true, status: 'ENABLED' } }] },
      });

      const list = await GoogleAdsApi.listCustomerClients({ auth: AUTH_WITH_MANAGER, managerId: '9998887777' });

      expect(sendRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          url: `${BASE}/customers/9998887777/googleAds:search`,
          body: {
            query:
              "SELECT customer_client.id, customer_client.descriptive_name, customer_client.manager, customer_client.test_account, customer_client.level, customer_client.status FROM customer_client WHERE customer_client.status = 'ENABLED' ORDER BY customer_client.level, customer_client.descriptive_name",
          },
        })
      );
      expect(list).toEqual({ clients: [{ id: '1111111111', descriptiveName: 'Client A', manager: false, testAccount: true }], truncated: false });
    });

    it('should return up to 2000 enabled accounts across pages without truncating', async () => {
      sendRequest
        .mockResolvedValueOnce({ body: { results: clientRows({ from: 0, count: 1000 }), nextPageToken: 'p2' } })
        .mockResolvedValueOnce({ body: { results: clientRows({ from: 1000, count: 1000 }) } });

      const list = await GoogleAdsApi.listCustomerClients({ auth: AUTH_WITH_MANAGER, managerId: '9998887777' });

      expect(list.clients).toHaveLength(2000);
      expect(list.truncated).toBe(false);
    });

    it('should report truncation when the manager has more than 2000 enabled accounts', async () => {
      sendRequest
        .mockResolvedValueOnce({ body: { results: clientRows({ from: 0, count: 1000 }), nextPageToken: 'p2' } })
        .mockResolvedValueOnce({ body: { results: clientRows({ from: 1000, count: 1001 }), nextPageToken: 'p3' } });

      const list = await GoogleAdsApi.listCustomerClients({ auth: AUTH_WITH_MANAGER, managerId: '9998887777' });

      expect(list.clients).toHaveLength(2000);
      expect(list.truncated).toBe(true);
      expect(sendRequest).toHaveBeenCalledTimes(2);
    });
  });

  describe('customerInfo()', () => {
    it('should map the customer row', async () => {
      sendRequest.mockResolvedValue({
        body: { results: [{ customer: { id: '1234567890', descriptiveName: 'Acme', manager: false, testAccount: true } }] },
      });

      const info = await GoogleAdsApi.customerInfo({ auth: AUTH, customerId: '1234567890' });

      expect(info).toEqual({ id: '1234567890', descriptiveName: 'Acme', manager: false, testAccount: true });
    });

    it('should fall back to the id when the row is missing', async () => {
      sendRequest.mockResolvedValue({ body: { results: [] } });

      expect(await GoogleAdsApi.customerInfo({ auth: AUTH, customerId: '123-456-7890' })).toEqual({ id: '1234567890' });
    });
  });

  describe('when Google answers with an error', () => {
    it('should surface every GoogleAdsFailure entry with code, field, trigger and request-id', async () => {
      sendRequest.mockRejectedValue(
        httpError(400, {
          error: {
            code: 400,
            message: 'Request contains an invalid argument.',
            status: 'INVALID_ARGUMENT',
            details: [
              {
                '@type': 'type.googleapis.com/google.ads.googleads.v25.errors.GoogleAdsFailure',
                errors: [
                  {
                    errorCode: { queryError: 'BAD_FIELD_NAME' },
                    message: "Unrecognized field name 'campaign.nme'.",
                    trigger: { stringValue: 'campaign.nme' },
                    location: { fieldPathElements: [{ fieldName: 'query' }] },
                  },
                ],
                requestId: 'req-123',
              },
            ],
          },
        })
      );

      await expect(GoogleAdsApi.search({ auth: AUTH, customerId: '1234567890', query: 'SELECT campaign.nme FROM campaign' })).rejects.toMatchObject({
        name: 'GoogleAdsApiError',
        status: 400,
        googleStatus: 'INVALID_ARGUMENT',
        requestId: 'req-123',
        errors: [
          {
            code: 'queryError.BAD_FIELD_NAME',
            message: "Unrecognized field name 'campaign.nme'.",
            field: 'query',
            trigger: 'campaign.nme',
          },
        ],
        message:
          "Google Ads API returned 400 (INVALID_ARGUMENT): queryError.BAD_FIELD_NAME: Unrecognized field name 'campaign.nme'. [query] (trigger: campaign.nme) [request-id: req-123]",
      });
    });

    it('should fall back to the status message when there is no GoogleAdsFailure', async () => {
      sendRequest.mockRejectedValue(
        httpError(403, { error: { code: 403, message: 'The caller does not have permission', status: 'PERMISSION_DENIED' } })
      );

      await expect(GoogleAdsApi.listAccessibleCustomers(AUTH)).rejects.toThrow(
        'Google Ads API returned 403 (PERMISSION_DENIED): The caller does not have permission'
      );
    });

    it('should fall back to the raw body when it is not JSON', async () => {
      sendRequest.mockRejectedValue(httpError(502, 'Bad Gateway'));

      await expect(GoogleAdsApi.listAccessibleCustomers(AUTH)).rejects.toBeInstanceOf(GoogleAdsApiError);
      await expect(GoogleAdsApi.listAccessibleCustomers(AUTH)).rejects.toThrow('Google Ads API returned 502: Bad Gateway');
    });

    it('should rethrow errors that are not HttpError untouched', async () => {
      const boom = new Error('socket hang up');
      sendRequest.mockRejectedValue(boom);

      await expect(GoogleAdsApi.listAccessibleCustomers(AUTH)).rejects.toBe(boom);
    });
  });
});
