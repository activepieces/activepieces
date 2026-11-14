import { HttpRequest, httpClient } from '@activepieces/pieces-common';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createTaskInternals } from '../src/lib/actions/create-task';
import { dynamicsCommonInternals } from '../src/lib/common';
import { DynamicsCRMClient } from '../src/lib/common/client';
import { outputKeys } from '../src/lib/common/output-schemas';
import { odata } from '../src/lib/common/odata';
import { salesEntities } from '../src/lib/common/sales-entities';

const ID = '6f3c6d2a-4b1e-ef11-8406-000d3a4f1234';

describe('sales entity helpers', () => {
  it('builds a contact body with lookup bind, letting typed fields win over additional fields', () => {
    const body = salesEntities.buildBody({
      entity: salesEntities.CONTACT,
      values: { lastname: 'Doe', firstname: '', parentAccount: ID, additionalFields: { lastname: 'Ignored', donotemail: true } },
    });
    expect(body).toEqual({ lastname: 'Doe', donotemail: true, 'parentcustomerid_account@odata.bind': `/accounts(${ID})` });
  });

  it('rejects both opportunity customers and coerces numbers and dates', () => {
    expect(() =>
      salesEntities.buildBody({ entity: salesEntities.OPPORTUNITY, values: { name: 'x', customerAccount: ID, customerContact: ID } })
    ).toThrow(/only one/);
    expect(
      salesEntities.buildBody({ entity: salesEntities.OPPORTUNITY, values: { name: 'x', estimatedvalue: '1500', estimatedclosedate: '2026-12-31T00:00:00.000Z' } })
    ).toEqual({ name: 'x', estimatedvalue: 1500, estimatedclosedate: '2026-12-31' });
  });

  it('escapes LIKE wildcards in contains searches but not in exact ones', () => {
    expect(salesEntities.findFilter({ entity: salesEntities.ACCOUNT, searchBy: 'name', value: '100%off', match: 'contains' })).toBe("contains(name,'100[%]off')");
    expect(salesEntities.findFilter({ entity: salesEntities.ACCOUNT, searchBy: 'name', value: '100%off', match: 'exact' })).toBe("name eq '100%off'");
  });

  it('escapes find values', () => {
    expect(salesEntities.findFilter({ entity: salesEntities.CONTACT, searchBy: 'full_name', value: "O'Brien", match: 'contains' })).toBe("contains(fullname,'O''Brien')");
    expect(salesEntities.findFilter({ entity: salesEntities.ACCOUNT, searchBy: 'name', value: 'Contoso', match: 'exact' })).toBe("name eq 'Contoso'");
  });

  it('summarizes QualifyLead output', () => {
    expect(
      salesEntities.summarizeQualify({
        leadId: ID,
        created: [
          { '@odata.type': '#Microsoft.Dynamics.CRM.account', accountid: 'a' },
          { '@odata.type': '#Microsoft.Dynamics.CRM.opportunity', opportunityid: 'o' },
        ],
      })
    ).toEqual({
      leadId: ID,
      accountId: 'a',
      contactId: null,
      opportunityId: 'o',
      createdEntities: [
        { entityType: 'account', id: 'a' },
        { entityType: 'opportunity', id: 'o' },
      ],
    });
  });

  it('validates status reasons', () => {
    expect(salesEntities.statusReason({ value: undefined, fallback: 4 })).toBe(4);
    expect(salesEntities.statusReason({ value: '5', fallback: 4 })).toBe(5);
    expect(() => salesEntities.statusReason({ value: 'lost', fallback: 4 })).toThrow();
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('generic record output', () => {
  it('drops @odata keys and adds id, entity set and every declared key', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockImplementation(async (request: HttpRequest) => ({
      status: 200,
      headers: {},
      body: { value: [{ LogicalName: 'account', EntitySetName: 'accounts', PrimaryIdAttribute: 'accountid', PrimaryNameAttribute: 'name' }], url: request.url },
    }));
    const client = new DynamicsCRMClient({ hostUrl: 'https://orgx.crm.dynamics.com', accessToken: 't' });
    const shaped = await dynamicsCommonInternals.shapeGenericRecord({
      client,
      entitySet: 'accounts',
      record: { '@odata.context': 'https://orgx/$metadata#accounts/$entity', '@odata.etag': 'W/"9"', accountid: ID, name: 'Contoso' },
    });
    expect(Object.keys(shaped).filter((key) => key.includes('@'))).toEqual([]);
    expect(shaped).toMatchObject({ id: ID, entitySet: 'accounts', etag: 'W/"9"', name: 'Contoso', statecode: null, modifiedon: null });
    for (const key of outputKeys.record) {
      expect(shaped).toHaveProperty(key);
    }
  });
});

describe('create task priority', () => {
  it('accepts codes and names and rejects junk', () => {
    expect(createTaskInternals.readPriority('2')).toBe(2);
    expect(createTaskInternals.readPriority('High')).toBe(2);
    expect(createTaskInternals.readPriority(undefined)).toBeUndefined();
    expect(() => createTaskInternals.readPriority('urgent')).toThrow(/Priority must be/);
  });
});

describe('sales output', () => {
  it('fills declared contact keys that Dynamics omitted from return=representation', () => {
    const shaped = odata.shapeRecord({ record: { contactid: ID, lastname: 'Doe' }, keys: outputKeys.contact });
    for (const key of outputKeys.contact) {
      expect(shaped).toHaveProperty(key);
    }
    expect(shaped['telephone1']).toBeNull();
  });
});

describe('qualify lead with an existing account', () => {
  const ACCOUNT = '11111111-2222-3333-4444-555555555555';
  const OPP = '99999999-8888-7777-6666-555555555555';

  function capture({ failPatch }: { failPatch: boolean }) {
    const requests: HttpRequest[] = [];
    vi.spyOn(httpClient, 'sendRequest').mockImplementation(async (request: HttpRequest) => {
      requests.push(request);
      if (request.url.endsWith('QualifyLead')) {
        return {
          status: 200,
          headers: {},
          body: {
            value: [
              { '@odata.type': '#Microsoft.Dynamics.CRM.contact', contactid: 'c' },
              { '@odata.type': '#Microsoft.Dynamics.CRM.opportunity', opportunityid: OPP },
            ],
          },
        };
      }
      if (failPatch) {
        throw new Error('network down');
      }
      return { status: 200, headers: {}, body: { opportunityid: OPP } };
    });
    return requests;
  }

  const client = () => new DynamicsCRMClient({ hostUrl: 'https://orgx.crm.dynamics.com', accessToken: 't' });

  it('re-points the new opportunity customer to the account with If-Match and returns the account id', async () => {
    const requests = capture({ failPatch: false });
    const result = await salesEntities.qualifyLead({
      client: client(),
      leadId: ID,
      createAccount: false,
      createContact: true,
      createOpportunity: true,
      existingAccountId: ACCOUNT,
    });
    expect(requests).toHaveLength(2);
    expect(requests[1].method).toBe('PATCH');
    expect(requests[1].url).toBe(`https://orgx.crm.dynamics.com/api/data/v9.2/opportunities(${OPP})`);
    expect(requests[1].headers?.['If-Match']).toBe('*');
    expect(requests[1].body).toEqual({ 'customerid_account@odata.bind': `/accounts(${ACCOUNT})` });
    expect(result).toMatchObject({ accountId: ACCOUNT, contactId: 'c', opportunityId: OPP });
  });

  it('sends no PATCH without an existing account', async () => {
    const requests = capture({ failPatch: false });
    const result = await salesEntities.qualifyLead({ client: client(), leadId: ID, createAccount: true, createContact: true, createOpportunity: true });
    expect(requests).toHaveLength(1);
    expect(result.accountId).toBeNull();
  });

  it('says the lead was already qualified when the customer update fails', async () => {
    capture({ failPatch: true });
    await expect(
      salesEntities.qualifyLead({ client: client(), leadId: ID, createAccount: false, createContact: true, createOpportunity: true, existingAccountId: ACCOUNT })
    ).rejects.toThrow(/lead was qualified.*Do not qualify again/);
  });
});

describe('date-only columns', () => {
  it('sends YYYY-MM-DD for DateOnly columns and keeps full timestamps elsewhere', async () => {
    const requests: HttpRequest[] = [];
    vi.spyOn(httpClient, 'sendRequest').mockImplementation(async (request: HttpRequest) => {
      requests.push(request);
      if (request.url.includes('DateTimeAttributeMetadata')) {
        return {
          status: 200,
          headers: {},
          body: { value: [
            { LogicalName: 'birthdate', Format: 'DateOnly', DateTimeBehavior: { Value: 'DateOnly' } },
            { LogicalName: 'anniversary', Format: 'DateAndTime', DateTimeBehavior: { Value: 'DateOnly' } },
            { LogicalName: 'lastusedincampaign', Format: 'DateAndTime', DateTimeBehavior: { Value: 'UserLocal' } },
          ] },
        };
      }
      return { status: 200, headers: {}, body: { value: [{ LogicalName: 'contact', EntitySetName: 'contacts', PrimaryIdAttribute: 'contactid', PrimaryNameAttribute: 'fullname' }] } };
    });
    const client = new DynamicsCRMClient({ hostUrl: 'https://orgx.crm.dynamics.com', accessToken: 't' });
    const body = await dynamicsCommonInternals.normalizeDateOnlyFields({
      client,
      entitySet: 'contacts',
      body: { birthdate: '1990-05-01T00:00:00.000Z', anniversary: '2020-06-01T10:00:00Z', lastusedincampaign: '2026-01-01T10:00:00Z', lastname: 'Doe' },
    });
    expect(body).toEqual({ birthdate: '1990-05-01', anniversary: '2020-06-01', lastusedincampaign: '2026-01-01T10:00:00Z', lastname: 'Doe' });
    requests.length = 0;
    await dynamicsCommonInternals.normalizeDateOnlyFields({ client, entitySet: 'contacts', body: { lastname: 'Doe' } });
    expect(requests).toHaveLength(0);
  });
});
