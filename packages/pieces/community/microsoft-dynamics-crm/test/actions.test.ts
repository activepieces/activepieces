import { HttpRequest, httpClient } from '@activepieces/pieces-common';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createTaskAction, createTaskInternals } from '../src/lib/actions/create-task';
import { PropertyType } from '@activepieces/pieces-framework';
import { createContactAction } from '../src/lib/actions/sales/create-contact';
import { updateContactAction } from '../src/lib/actions/sales/update-contact';
import { createLeadAction } from '../src/lib/actions/sales/create-lead';
import { updateLeadAction } from '../src/lib/actions/sales/update-lead';
import { createAccountAction } from '../src/lib/actions/sales/create-account';
import { updateAccountAction } from '../src/lib/actions/sales/update-account';
import { createOpportunityAction } from '../src/lib/actions/sales/create-opportunity';
import { updateOpportunityAction } from '../src/lib/actions/sales/update-opportunity';
import { findContactAction } from '../src/lib/actions/sales/find-contact';
import { findLeadAction } from '../src/lib/actions/sales/find-lead';
import { findAccountAction } from '../src/lib/actions/sales/find-account';
import { findOpportunityAction } from '../src/lib/actions/sales/find-opportunity';
import { qualifyLeadAction } from '../src/lib/actions/sales/qualify-lead';
import { winOpportunityAction } from '../src/lib/actions/sales/win-opportunity';
import { loseOpportunityAction } from '../src/lib/actions/sales/lose-opportunity';
import { searchRecordsAction } from '../src/lib/actions/search-records';
import { runFetchXmlAction } from '../src/lib/actions/run-fetchxml';
import { getRecordAction } from '../src/lib/actions/get-record';
import { dynamicsCommonInternals } from '../src/lib/common';
import { DynamicsCRMClient } from '../src/lib/common/client';
import { outputKeys } from '../src/lib/common/output-schemas';
import { odata } from '../src/lib/common/odata';
import { salesEntities } from '../src/lib/common/sales-entities';
import { dynamicsProps } from '../src/lib/common/props';
import { EntityAttributeType, MAX_PAGE_SIZE } from '../src/lib/common/constants';

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

describe('table dropdown order', () => {
  it('pins sales tables, sorts the rest A-Z and puts both deprecated styles last', () => {
    const option = (label: string, value: string) => ({ label, value });
    const sorted = dynamicsCommonInternals.sortTableOptions([
      option('[DEPRECATED] Playbook category (playbookcategories)', 'playbookcategories'),
      option('Task (tasks)', 'tasks'),
      option('Opportunity (opportunities)', 'opportunities'),
      option('(Deprecated) Contact Note (contactnotes)', 'contactnotes'),
      option('[Deprecated] Dynamics Customer Service A (dcsa)', 'dcsa'),
      option('Account (accounts)', 'accounts'),
      option('appointment (appointments)', 'appointments'),
      option('Contact (contacts)', 'contacts'),
      option('Application Type (Deprecated) (applicationtypes)', 'applicationtypes'),
      option('Chat Widget Language(deprecated) (msdyn_chatlanguages)', 'msdyn_chatlanguages'),
    ]);
    expect(sorted.map((o) => o.value)).toEqual([
      'accounts',
      'contacts',
      'opportunities',
      'appointments',
      'tasks',
      'applicationtypes',
      'msdyn_chatlanguages',
      'contactnotes',
      'dcsa',
      'playbookcategories',
    ]);
  });
});

describe('column dropdown order', () => {
  it('sorts columns A-Z with deprecated columns last and no pinned tables', () => {
    const sorted = dynamicsCommonInternals.sortDeprecatedLast([
      { label: '(Deprecated) Process Stage (stageid)', value: 'stageid' },
      { label: 'Name (name)', value: 'name' },
      { label: 'account number (accountnumber)', value: 'accountnumber' },
      { label: '(Deprecated) Traversed Path (traversedpath)', value: 'traversedpath' },
      { label: 'Contacts (contacts)', value: 'contacts' },
    ]);
    expect(sorted.map((o) => o.value)).toEqual(['accountnumber', 'contacts', 'name', 'stageid', 'traversedpath']);
  });
});

describe('round 4 dropdown and field order', () => {
  const label = (text: string) => ({ UserLocalizedLabel: { Label: text } });
  const entity = (logical: string, set: string | null, display: string | undefined, flags: { HasNotes?: boolean; HasActivities?: boolean } = {}) => ({
    LogicalName: logical,
    EntitySetName: set,
    PrimaryIdAttribute: `${logical}id`,
    PrimaryNameAttribute: 'name',
    DisplayName: display ? label(display) : undefined,
    ...flags,
  });

  it('labels relationships by related table, sorts them A-Z and keeps the value', () => {
    const options = dynamicsProps.relationshipLabelOptions({
      entities: [entity('contact', 'contacts', 'Contact'), entity('task', 'tasks', 'Task'), entity('playbook', 'playbooks', '(Deprecated) Playbook'), entity('nameless', 'namelesses', undefined), entity('noset', null, 'No Set')],
      relationships: [
        { navigationProperty: 'Account_Tasks', targetEntity: 'task', schemaName: 'Account_Tasks', kind: 'one_to_many' },
        { navigationProperty: 'account_playbooks', targetEntity: 'playbook', schemaName: 'p', kind: 'many_to_many' },
        { navigationProperty: 'contact_customer_accounts', targetEntity: 'contact', schemaName: 'c', kind: 'one_to_many' },
        { navigationProperty: 'account_nameless', targetEntity: 'nameless', schemaName: 'n', kind: 'one_to_many' },
        { navigationProperty: 'account_noset', targetEntity: 'noset', schemaName: 's', kind: 'one_to_many' },
      ],
    });
    expect(options).toEqual([
      { label: 'Contact · contact_customer_accounts (one-to-many)', value: 'contact_customer_accounts|contacts' },
      { label: 'nameless · account_nameless (one-to-many)', value: 'account_nameless|namelesses' },
      { label: 'Task · Account_Tasks (one-to-many)', value: 'Account_Tasks|tasks' },
      { label: '(Deprecated) Playbook · account_playbooks (many-to-many)', value: 'account_playbooks|playbooks' },
    ]);
  });

  it('filters tables by HasNotes and HasActivities', () => {
    const entities = [
      entity('account', 'accounts', 'Account', { HasNotes: true, HasActivities: true }),
      entity('task', 'tasks', 'Task', { HasNotes: true }),
      entity('role', 'roles', 'Role'),
    ];
    expect(dynamicsCommonInternals.tableOptions({ entities, include: (e) => e.HasNotes === true }).map((o) => o.value)).toEqual(['accounts', 'tasks']);
    expect(dynamicsCommonInternals.tableOptions({ entities, include: (e) => e.HasActivities === true }).map((o) => o.value)).toEqual(['accounts']);
  });

  it('orders fields: primary name, required, then the rest A-Z with deprecated last', () => {
    const attribute = (logical: string, display: string, extra: { IsPrimaryName?: boolean; RequiredLevel?: { Value?: string } } = {}) => ({
      AttributeType: EntityAttributeType.STRING,
      LogicalName: logical,
      DisplayName: label(display),
      ...extra,
    });
    const ordered = dynamicsCommonInternals.orderFieldAttributes([
      attribute('zeta', 'Zeta'),
      attribute('old', '(Deprecated) Alpha'),
      attribute('owner', 'Owner', { RequiredLevel: { Value: 'SystemRequired' } }),
      attribute('beta', 'beta'),
      attribute('name', 'Account Name', { IsPrimaryName: true, RequiredLevel: { Value: 'ApplicationRequired' } }),
      attribute('lastname', 'Last Name', { RequiredLevel: { Value: 'ApplicationRequired' } }),
      attribute('rec', 'Recommended', { RequiredLevel: { Value: 'Recommended' } }),
    ]);
    expect(ordered.map((a) => a.LogicalName)).toEqual(['name', 'lastname', 'owner', 'beta', 'rec', 'zeta', 'old']);
  });
});

describe('record dropdown hint', () => {
  it('shows the empty hint only for an empty unfiltered table', () => {
    expect(dynamicsCommonInternals.recordPlaceholder({ hasMore: false, isEmpty: true })).toBe('No records yet. Map an ID instead.');
    expect(dynamicsCommonInternals.recordPlaceholder({ hasMore: true, isEmpty: false })).toBe('Showing the first 100 records. Type to search by name.');
    expect(dynamicsCommonInternals.recordPlaceholder({ hasMore: false, isEmpty: false })).toBeUndefined();
  });
});

describe('round 5 choice fields', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sends the integer choice value on create and update', () => {
    expect(
      salesEntities.buildBody({ entity: salesEntities.LEAD, values: { lastname: 'Doe', leadsourcecode: 3, leadqualitycode: '1', industrycode: 7 } })
    ).toEqual({ lastname: 'Doe', leadsourcecode: 3, leadqualitycode: 1, industrycode: 7 });
    expect(salesEntities.buildBody({ entity: salesEntities.ACCOUNT, values: { industrycode: 12 } })).toEqual({ industrycode: 12 });
    expect(salesEntities.buildBody({ entity: salesEntities.OPPORTUNITY, values: { opportunityratingcode: 2 } })).toEqual({ opportunityratingcode: 2 });
    expect(() => salesEntities.buildBody({ entity: salesEntities.LEAD, values: { leadqualitycode: '1.5' } })).toThrow(/whole number/);
  });

  it('skips empty choice values so an update does not clear the field', () => {
    expect(
      salesEntities.buildBody({ entity: salesEntities.LEAD, values: { firstname: 'Ann', leadsourcecode: undefined, leadqualitycode: null, industrycode: '' } })
    ).toEqual({ firstname: 'Ann' });
  });

  it('loads choices from the environment option set metadata', async () => {
    const spy = vi.spyOn(DynamicsCRMClient.prototype, 'fetchOptionFieldValues').mockResolvedValue([
      { value: 1, label: 'Hot' },
      { value: 2, label: 'Warm' },
      { value: 3, label: 'Cold' },
    ]);
    const prop = salesEntities.fieldProps({ entity: salesEntities.LEAD, mode: 'update' })['leadqualitycode'];
    expect(prop.type).toBe(PropertyType.DROPDOWN);
    expect(prop.required).toBe(false);
    if (prop.type !== PropertyType.DROPDOWN) {
      return;
    }
    const state = await prop.options(
      { auth: { access_token: 't', props: { hostUrl: 'https://orgx.crm.dynamics.com' } } },
      { searchValue: undefined }
    );
    expect(state).toEqual({ disabled: false, options: [{ value: 1, label: 'Hot' }, { value: 2, label: 'Warm' }, { value: 3, label: 'Cold' }] });
    expect(spy).toHaveBeenCalledWith({ logicalName: 'lead', attribute: 'leadqualitycode', attributeType: 'Picklist' });
  });

  it('adds every choice column to the action output keys', () => {
    expect(outputKeys.lead).toEqual(expect.arrayContaining(['leadsourcecode', 'leadqualitycode', 'industrycode']));
    expect(outputKeys.account).toContain('industrycode');
    expect(outputKeys.opportunity).toContain('opportunityratingcode');
  });
});

describe('round 5b props metadata', () => {
  const VALID_ICONS = ['text', 'code', 'markdown', 'reply', 'reply-all', 'users', 'user', 'send', 'type', 'file', 'paperclip', 'tag', 'inbox', 'calendar', 'trash', 'filter', 'sliders', 'blank'];
  const actions = [
    createContactAction, updateContactAction, createLeadAction, updateLeadAction, createAccountAction, updateAccountAction,
    createOpportunityAction, updateOpportunityAction, findContactAction, findLeadAction, findAccountAction, findOpportunityAction,
    createTaskAction, searchRecordsAction, runFetchXmlAction, qualifyLeadAction, getRecordAction, winOpportunityAction, loseOpportunityAction,
  ];

  it('keeps group members, reveals and advanced flags consistent', () => {
    for (const action of actions) {
      const props: Record<string, { required: boolean; advanced?: boolean; reveals?: string[] }> = action.props;
      const grouped = (action.propertyGroups ?? []).flatMap((group) => {
        expect(VALID_ICONS).toContain(group.icon);
        return group.props;
      });
      for (const name of grouped) {
        expect(props[name], `${action.name}.${name}`).toBeDefined();
        expect(props[name].advanced, `${action.name}.${name}`).not.toBe(true);
      }
      for (const [name, prop] of Object.entries(props)) {
        if (prop.required) {
          expect(prop.advanced, `${action.name}.${name}`).not.toBe(true);
        }
        for (const target of prop.reveals ?? []) {
          expect(props[target], `${action.name}.${name} reveals ${target}`).toBeDefined();
        }
      }
    }
  });

  it('uses cards only on 2-4 choices with valid icons', () => {
    for (const action of actions) {
      for (const prop of Object.values(action.props)) {
        if (prop.type !== PropertyType.STATIC_DROPDOWN || prop.display !== 'cards') {
          continue;
        }
        expect(prop.options.options.length).toBeGreaterThanOrEqual(2);
        expect(prop.options.options.length).toBeLessThanOrEqual(4);
        for (const option of prop.options.options) {
          if (option.icon !== undefined) {
            expect(VALID_ICONS).toContain(option.icon);
          }
        }
      }
    }
  });

  it('applies the expected display upgrades', () => {
    expect(createLeadAction.propertyGroups?.map((group) => group.key)).toEqual(['name', 'contactInfo']);
    expect(createAccountAction.props['address1_city'].advanced).toBe(true);
    expect(createAccountAction.props['additionalFields'].advanced).toBe(true);
    expect(createContactAction.props['firstname'].width).toBe('half');
    expect(searchRecordsAction.props.limit).toMatchObject({ display: 'stepper', min: 1, max: MAX_PAGE_SIZE });
    expect(createOpportunityAction.props['closeprobability']).not.toHaveProperty('display');
    expect(createOpportunityAction.props['closeprobability'].defaultValue).toBeUndefined();
    expect(qualifyLeadAction.props.createOpportunity.reveals).toEqual(['existingAccountId']);
    expect(createTaskAction.props.priority).toMatchObject({ display: 'cards' });
  });
});

describe('final check fixes', () => {
  it('puts the Qualify Lead reveal toggle inside a section so the builder honours it', () => {
    const groups = qualifyLeadAction.propertyGroups ?? [];
    const owner = groups.find((group) => group.props.includes('createOpportunity'));
    expect(owner?.display).toBe('section');
    expect(qualifyLeadAction.props.createOpportunity.reveals).toEqual(['existingAccountId']);
    expect(groups[0].props).toEqual(['leadId']);
    expect(groups.flatMap((group) => group.props)).not.toContain('existingAccountId');
  });

  it('uses mode-specific choice help text without the table name', () => {
    const create = salesEntities.fieldProps({ entity: salesEntities.LEAD, mode: 'create' })['leadsourcecode'];
    const update = salesEntities.fieldProps({ entity: salesEntities.LEAD, mode: 'update' })['leadsourcecode'];
    expect(create.description).toBe('Choices load from your Dynamics 365.');
    expect(update.description).toBe('Leave empty to keep the current value.');
  });

  it('does not send an empty probability', () => {
    for (const closeprobability of [undefined, null, '']) {
      expect(salesEntities.buildBody({ entity: salesEntities.OPPORTUNITY, values: { name: 'x', closeprobability } })).toEqual({ name: 'x' });
    }
  });

  it('renders Account Name in the first section on Create Account', () => {
    expect(createAccountAction.propertyGroups?.[0].props).toEqual(['name', 'accountnumber']);
    expect(createAccountAction.props['name'].required).toBe(true);
  });
});
