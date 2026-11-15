import { HttpError, HttpMethod, HttpRequest, httpClient } from '@activepieces/pieces-common';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DynamicsApiError, DynamicsCRMClient, dynamicsClientInternals } from '../src/lib/common/client';

const ID = '6f3c6d2a-4b1e-ef11-8406-000d3a4f1234';

function newClient({ proxyUrl }: { proxyUrl?: string } = {}) {
  return new DynamicsCRMClient({ hostUrl: 'orgx.crm.dynamics.com/', accessToken: 'token', proxyUrl });
}

function captureRequests({ body, status }: { body: unknown; status?: number }) {
  const requests: HttpRequest[] = [];
  vi.spyOn(httpClient, 'sendRequest').mockImplementation(async (request) => {
    requests.push(request);
    return { status: status ?? 200, headers: {}, body };
  });
  return requests;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('DynamicsCRMClient', () => {
  it('sends If-Match * on update so a missing ID is not upserted', async () => {
    const requests = captureRequests({ body: { contactid: ID } });
    await newClient().updateRecord({ entitySet: 'contacts', recordId: ID, fields: { firstname: 'A' } });
    expect(requests[0].method).toBe(HttpMethod.PATCH);
    expect(requests[0].url).toBe(`https://orgx.crm.dynamics.com/api/data/v9.2/contacts(${ID})`);
    expect(requests[0].headers?.['If-Match']).toBe('*');
    expect(requests[0].headers?.['Prefer']).toBe('return=representation');
  });

  it('maps a Dataverse error body into the message and keeps it in responseBody', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockRejectedValue(
      new HttpError({}, { status: 404, responseBody: { error: { code: '0x80040217', message: 'contact With Id = x Does Not Exist' } } })
    );
    const error = await newClient().updateRecord({ entitySet: 'contacts', recordId: ID, fields: { a: 1 } }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(DynamicsApiError);
    expect(error).toMatchObject({ status: 404, message: 'Dynamics 365 update record failed (HTTP 404): contact With Id = x Does Not Exist (code 0x80040217)' });
    expect(error).not.toHaveProperty('body');
  });

  it('follows a same-environment nextLink through the proxy and refuses foreign hosts', async () => {
    const requests = captureRequests({ body: { value: [] } });
    await newClient({ proxyUrl: 'https://proxy.local' }).listRecords({
      entitySet: 'contacts',
      pageSize: 2,
      nextLink: 'https://orgx.crm.dynamics.com/api/data/v9.2/contacts?$skiptoken=abc',
    });
    expect(requests[0].url).toBe('https://proxy.local/api/data/v9.2/contacts?$skiptoken=abc');
    expect(requests[0].headers?.['Prefer']).toBe('odata.maxpagesize=2');
    await expect(
      newClient().listRecords({ entitySet: 'contacts', pageSize: 2, nextLink: 'https://orgx.crm.dynamics.com.evil.io/api/data/v9.2/contacts' })
    ).rejects.toThrow(/does not belong/);
  });

  it('returns records and nextLink from a page', async () => {
    captureRequests({ body: { value: [{ contactid: ID }], '@odata.nextLink': 'https://orgx.crm.dynamics.com/api/data/v9.2/contacts?$skiptoken=1' } });
    const page = await newClient().listRecords({ entitySet: 'contacts', pageSize: 1, filter: "lastname eq 'x'" });
    expect(page).toEqual({ records: [{ contactid: ID }], nextLink: 'https://orgx.crm.dynamics.com/api/data/v9.2/contacts?$skiptoken=1', hasMore: true });
  });

  it('url-encodes FetchXML and decodes the paging cookie', async () => {
    const requests = captureRequests({
      body: {
        value: [{ name: 'A' }],
        '@Microsoft.Dynamics.CRM.morerecords': true,
        '@Microsoft.Dynamics.CRM.fetchxmlpagingcookie': '<cookie pagenumber="2" pagingcookie="%253ccookie%2520page%253d%25221%2522%253e%253c%252fcookie%253e" istracking="False" />',
      },
    });
    const result = await newClient().runFetchXml({ entitySet: 'accounts', fetchXml: '<fetch><entity name="account"/></fetch>' });
    expect(requests[0].url).toBe(`https://orgx.crm.dynamics.com/api/data/v9.2/accounts?fetchXml=${encodeURIComponent('<fetch><entity name="account"/></fetch>')}`);
    expect(result).toEqual({ records: [{ name: 'A' }], moreRecords: true, pagingCookie: '<cookie page="1"></cookie>' });
  });

  it('binds the related record with the environment URL on associate', async () => {
    const requests = captureRequests({ body: '' });
    await newClient({ proxyUrl: 'https://proxy.local' }).associate({
      entitySet: 'accounts',
      recordId: ID,
      navigationProperty: 'contact_customer_accounts',
      relatedEntitySet: 'contacts',
      relatedRecordId: ID,
    });
    expect(requests[0].url).toBe(`https://proxy.local/api/data/v9.2/accounts(${ID})/contact_customer_accounts/$ref`);
    expect(requests[0].body).toEqual({ '@odata.id': `https://orgx.crm.dynamics.com/api/data/v9.2/contacts(${ID})` });
  });

  it('closes an opportunity with the OpportunityClose bind', async () => {
    const requests = captureRequests({ body: '' });
    await newClient().closeOpportunity({ opportunityId: ID, outcome: 'lost', status: 5, subject: 'Lost' });
    expect(requests[0].url).toBe('https://orgx.crm.dynamics.com/api/data/v9.2/LoseOpportunity');
    expect(requests[0].body).toEqual({ Status: 5, OpportunityClose: { subject: 'Lost', 'opportunityid@odata.bind': `/opportunities(${ID})` } });
  });

  it('says a POST may have applied when the network fails', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockRejectedValue(new Error('socket hang up'));
    await expect(newClient().createRecord({ entitySet: 'contacts', fields: { lastname: 'x' } })).rejects.toThrow(/may still have been applied/);
  });

  it('sends every request through a TLS-verifying undici Agent', async () => {
    const options: unknown[] = [];
    vi.spyOn(httpClient, 'sendRequest').mockImplementation(async (_request, option) => {
      options.push(option);
      return { status: 200, headers: {}, body: { UserId: ID, BusinessUnitId: ID, OrganizationId: ID } };
    });
    await newClient().whoAmI();
    const { Agent } = await import('undici');
    expect(options[0]).toMatchObject({ dispatcher: expect.any(Agent) });
  });

  it('backs off on 429 for GET with growing waits capped at 30 seconds', async () => {
    const waits: number[] = [];
    vi.spyOn(dynamicsClientInternals, 'sleep').mockImplementation(async (ms: number) => {
      waits.push(ms);
    });
    vi.spyOn(httpClient, 'sendRequest')
      .mockRejectedValueOnce(new HttpError({}, { status: 429, responseBody: { error: { message: 'limit' } } }))
      .mockRejectedValueOnce(new HttpError({}, { status: 429, responseBody: { error: { message: 'limit' } } }))
      .mockResolvedValueOnce({ status: 200, headers: {}, body: { UserId: ID, BusinessUnitId: ID, OrganizationId: ID } });
    await newClient().whoAmI();
    expect(waits).toEqual([2000, 4000]);
    expect(dynamicsClientInternals.retryDelayMs(10)).toBe(30000);
  });

  it('sends the attachment MIME type on a note', async () => {
    const requests: HttpRequest[] = [];
    vi.spyOn(httpClient, 'sendRequest').mockImplementation(async (request) => {
      requests.push(request);
      if (request.url.includes('EntityDefinitions?') || request.url.endsWith('EntityDefinitions')) {
        return { status: 200, headers: {}, body: { value: [{ LogicalName: 'account', EntitySetName: 'accounts', PrimaryIdAttribute: 'accountid', PrimaryNameAttribute: 'name' }] } };
      }
      if (request.url.includes('ManyToOneRelationships')) {
        return { status: 200, headers: {}, body: { value: [{ SchemaName: 'x', ReferencingAttribute: 'objectid', ReferencingEntityNavigationPropertyName: 'objectid_account', ReferencedEntity: 'account' }] } };
      }
      return { status: 201, headers: {}, body: { annotationid: ID } };
    });
    await newClient().addNote({ regardingEntitySet: 'accounts', regardingId: ID, text: 'hi', file: { filename: 'a.pdf', base64: 'eA==', mimeType: 'application/pdf' } });
    expect(requests.at(-1)?.body).toMatchObject({ mimetype: 'application/pdf', filename: 'a.pdf', isdocument: true, 'objectid_account@odata.bind': `/accounts(${ID})` });
  });
});
