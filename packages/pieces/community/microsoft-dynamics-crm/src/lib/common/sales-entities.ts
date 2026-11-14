import { InputPropertyMap, Property } from '@activepieces/pieces-framework';
import { DynamicsCRMClient } from './client';
import { odata } from './odata';
import { dynamicsProps } from './props';

const ADDRESS_FIELDS: FieldSpec[] = [
  { key: 'address1_line1', label: 'Street', kind: 'text' },
  { key: 'address1_city', label: 'City', kind: 'text' },
  { key: 'address1_stateorprovince', label: 'State / Province', kind: 'text' },
  { key: 'address1_postalcode', label: 'ZIP / Postal Code', kind: 'text' },
  { key: 'address1_country', label: 'Country / Region', kind: 'text' },
];

const CONTACT: SalesEntity = {
  entitySet: 'contacts',
  logicalName: 'contact',
  primaryId: 'contactid',
  label: 'Contact',
  fields: [
    { key: 'firstname', label: 'First Name', kind: 'text' },
    { key: 'lastname', label: 'Last Name', kind: 'text', requiredOnCreate: true },
    { key: 'emailaddress1', label: 'Email', kind: 'text' },
    { key: 'telephone1', label: 'Business Phone', kind: 'text' },
    { key: 'mobilephone', label: 'Mobile Phone', kind: 'text' },
    { key: 'jobtitle', label: 'Job Title', kind: 'text' },
    ...ADDRESS_FIELDS,
    { key: 'description', label: 'Description', kind: 'long_text' },
  ],
  lookups: [
    { key: 'parentAccount', label: 'Company (Account)', description: 'The account this contact works for.', entitySet: 'accounts', bind: 'parentcustomerid_account' },
  ],
  searchBy: [
    { value: 'email', label: 'Email', column: 'emailaddress1' },
    { value: 'full_name', label: 'Full Name', column: 'fullname' },
    { value: 'last_name', label: 'Last Name', column: 'lastname' },
    { value: 'phone', label: 'Business Phone', column: 'telephone1' },
  ],
};

const ACCOUNT: SalesEntity = {
  entitySet: 'accounts',
  logicalName: 'account',
  primaryId: 'accountid',
  label: 'Account',
  fields: [
    { key: 'name', label: 'Account Name', kind: 'text', requiredOnCreate: true },
    { key: 'accountnumber', label: 'Account Number', kind: 'text' },
    { key: 'emailaddress1', label: 'Email', kind: 'text' },
    { key: 'telephone1', label: 'Main Phone', kind: 'text' },
    { key: 'websiteurl', label: 'Website', kind: 'text' },
    ...ADDRESS_FIELDS,
    { key: 'description', label: 'Description', kind: 'long_text' },
  ],
  lookups: [
    { key: 'parentAccount', label: 'Parent Account', description: 'The parent company of this account.', entitySet: 'accounts', bind: 'parentaccountid' },
    { key: 'primaryContact', label: 'Primary Contact', description: 'The main contact for this account.', entitySet: 'contacts', bind: 'primarycontactid' },
  ],
  searchBy: [
    { value: 'name', label: 'Account Name', column: 'name' },
    { value: 'account_number', label: 'Account Number', column: 'accountnumber' },
    { value: 'email', label: 'Email', column: 'emailaddress1' },
  ],
};

const LEAD: SalesEntity = {
  entitySet: 'leads',
  logicalName: 'lead',
  primaryId: 'leadid',
  label: 'Lead',
  fields: [
    { key: 'subject', label: 'Topic', kind: 'text' },
    { key: 'firstname', label: 'First Name', kind: 'text' },
    { key: 'lastname', label: 'Last Name', kind: 'text', requiredOnCreate: true },
    { key: 'companyname', label: 'Company Name', kind: 'text' },
    { key: 'emailaddress1', label: 'Email', kind: 'text' },
    { key: 'telephone1', label: 'Business Phone', kind: 'text' },
    { key: 'mobilephone', label: 'Mobile Phone', kind: 'text' },
    { key: 'jobtitle', label: 'Job Title', kind: 'text' },
    { key: 'websiteurl', label: 'Website', kind: 'text' },
    ...ADDRESS_FIELDS,
    { key: 'description', label: 'Description', kind: 'long_text' },
  ],
  lookups: [
    { key: 'parentAccount', label: 'Existing Account', description: 'An existing account this lead belongs to.', entitySet: 'accounts', bind: 'parentaccountid' },
  ],
  searchBy: [
    { value: 'email', label: 'Email', column: 'emailaddress1' },
    { value: 'full_name', label: 'Full Name', column: 'fullname' },
    { value: 'company', label: 'Company Name', column: 'companyname' },
    { value: 'topic', label: 'Topic', column: 'subject' },
  ],
};

const OPPORTUNITY: SalesEntity = {
  entitySet: 'opportunities',
  logicalName: 'opportunity',
  primaryId: 'opportunityid',
  label: 'Opportunity',
  fields: [
    { key: 'name', label: 'Topic', kind: 'text', requiredOnCreate: true },
    { key: 'estimatedvalue', label: 'Est. Revenue', kind: 'number' },
    { key: 'estimatedclosedate', label: 'Est. Close Date', kind: 'date' },
    { key: 'closeprobability', label: 'Probability (%)', kind: 'number' },
    { key: 'description', label: 'Description', kind: 'long_text' },
  ],
  lookups: [
    { key: 'customerAccount', label: 'Customer Account', description: 'The account this opportunity is for. Set this or Customer Contact, not both.', entitySet: 'accounts', bind: 'customerid_account' },
    { key: 'customerContact', label: 'Customer Contact', description: 'The contact this opportunity is for. Set this or Customer Account, not both.', entitySet: 'contacts', bind: 'customerid_contact' },
  ],
  searchBy: [{ value: 'name', label: 'Topic', column: 'name' }],
  exclusiveLookups: ['customerAccount', 'customerContact'],
};

function fieldProps({ entity, mode }: { entity: SalesEntity; mode: 'create' | 'update' }): InputPropertyMap {
  const props: InputPropertyMap = {};
  for (const field of entity.fields) {
    const required = mode === 'create' && field.requiredOnCreate === true;
    const params = { displayName: field.label, required };
    switch (field.kind) {
      case 'long_text':
        props[field.key] = Property.LongText(params);
        break;
      case 'number':
        props[field.key] = Property.Number(params);
        break;
      case 'date':
        props[field.key] = Property.DateTime({ ...params, description: 'Only the date part is used.' });
        break;
      default:
        props[field.key] = Property.ShortText(params);
        break;
    }
  }
  for (const lookup of entity.lookups) {
    props[lookup.key] = dynamicsProps.fixedRecordDropdown({
      entitySet: lookup.entitySet,
      displayName: lookup.label,
      description: `${lookup.description} Type to search by name, or map a record ID.`,
      required: false,
    });
  }
  props['additionalFields'] = Property.Json({
    displayName: 'Additional Fields',
    description:
      'Optional extra Web API fields by logical name, for example {"donotemail": true}. The fields above win over the same key here.',
    required: false,
  });
  return props;
}

function readNumber({ value, label }: { value: unknown; label: string }): number {
  const number = typeof value === 'number' ? value : Number(String(value).trim());
  if (!Number.isFinite(number)) {
    throw new Error(`${label} must be a number.`);
  }
  return number;
}

function readDate({ value, label }: { value: unknown; label: string }): string {
  const text = String(value).trim();
  if (!/^\d{4}-\d{2}-\d{2}/.test(text) || Number.isNaN(Date.parse(text.slice(0, 10)))) {
    throw new Error(`${label} must be a date such as 2026-12-31.`);
  }
  return text.slice(0, 10);
}

function buildBody({ entity, values }: { entity: SalesEntity; values: Record<string, unknown> }): Record<string, unknown> {
  const exclusive = entity.exclusiveLookups ?? [];
  const setExclusive = exclusive.filter((key) => dynamicsProps.readString(values[key]) !== undefined);
  if (setExclusive.length > 1) {
    const labels = entity.lookups.filter((lookup) => setExclusive.includes(lookup.key)).map((lookup) => lookup.label);
    throw new Error(`Set only one of ${labels.join(' or ')}.`);
  }
  const body: Record<string, unknown> = { ...odata.parseJsonObject({ value: values['additionalFields'], label: 'Additional Fields' }) };
  for (const field of entity.fields) {
    const value = values[field.key];
    if (value === undefined || value === null || value === '') {
      continue;
    }
    switch (field.kind) {
      case 'number':
        body[field.key] = readNumber({ value, label: field.label });
        break;
      case 'date':
        body[field.key] = readDate({ value, label: field.label });
        break;
      default:
        body[field.key] = String(value);
        break;
    }
  }
  for (const lookup of entity.lookups) {
    const value = dynamicsProps.readString(values[lookup.key]);
    if (value === undefined) {
      continue;
    }
    const id = odata.requireGuid({ value, label: lookup.label });
    body[`${lookup.bind}@odata.bind`] = odata.bindPath({ entitySet: lookup.entitySet, id });
  }
  return body;
}

function findFilter({ entity, searchBy, value, match }: FindFilterParams): string {
  const option = entity.searchBy.find((item) => item.value === searchBy);
  if (!option) {
    throw new Error(`Search By must be one of: ${entity.searchBy.map((item) => item.value).join(', ')}.`);
  }
  const text = typeof value === 'string' ? value.trim() : typeof value === 'number' ? String(value) : '';
  if (text === '') {
    throw new Error('Search Value is required.');
  }
  return match === 'contains'
    ? `contains(${option.column},'${odata.escapeContains(text)}')`
    : `${option.column} eq '${odata.escapeString(text)}'`;
}

function findProps(entity: SalesEntity) {
  return {
    searchBy: Property.StaticDropdown({
      displayName: 'Search By',
      required: true,
      defaultValue: entity.searchBy[0].value,
      options: {
        disabled: false,
        options: entity.searchBy.map((item) => ({ label: item.label, value: item.value })),
      },
    }),
    searchValue: Property.ShortText({
      displayName: 'Search Value',
      required: true,
    }),
    match: Property.StaticDropdown({
      displayName: 'Match',
      required: true,
      defaultValue: 'exact',
      options: {
        disabled: false,
        options: [
          { label: 'Exact match', value: 'exact' },
          { label: 'Contains', value: 'contains' },
        ],
      },
    }),
  };
}

function summarizeQualify({ leadId, created }: { leadId: string; created: Record<string, unknown>[] }): QualifySummary {
  const createdEntities = created
    .map((item) => {
      const type = typeof item['@odata.type'] === 'string' ? item['@odata.type'].replace('#Microsoft.Dynamics.CRM.', '') : '';
      const id = type !== '' ? item[`${type}id`] : undefined;
      return typeof id === 'string' ? { entityType: type, id } : undefined;
    })
    .filter((item): item is { entityType: string; id: string } => item !== undefined);
  const idOf = (entityType: string) => createdEntities.find((item) => item.entityType === entityType)?.id ?? null;
  return {
    leadId,
    accountId: idOf('account'),
    contactId: idOf('contact'),
    opportunityId: idOf('opportunity'),
    createdEntities,
  };
}

async function qualifyLead({ client, leadId, createAccount, createContact, createOpportunity, existingAccountId }: QualifyParams): Promise<QualifySummary> {
  const accountId = existingAccountId === undefined ? undefined : odata.requireGuid({ value: existingAccountId, label: 'Existing account ID' });
  const created = await client.qualifyLead({ leadId, createAccount, createContact, createOpportunity, existingAccountId: accountId });
  const summary = summarizeQualify({ leadId, created });
  if (accountId === undefined) {
    return summary;
  }
  if (summary.opportunityId !== null) {
    try {
      await client.updateRecord({
        entitySet: 'opportunities',
        recordId: summary.opportunityId,
        fields: { 'customerid_account@odata.bind': odata.bindPath({ entitySet: 'accounts', id: accountId }) },
      });
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'unknown error';
      throw new Error(
        `The lead was qualified and opportunity ${summary.opportunityId} was created, but setting its customer to account ${accountId} failed: ${reason}. Do not qualify again; update the opportunity customer instead.`
      );
    }
  }
  return { ...summary, accountId: summary.accountId ?? accountId };
}

function statusReason({ value, fallback }: { value: unknown; fallback: number }): number {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }
  const number = Number(value);
  if (!Number.isInteger(number) || number <= 0) {
    throw new Error('Status Reason must be a whole number option value, for example 3 (Won), 4 (Canceled) or 5 (Out-Sold).');
  }
  return number;
}

type QualifyParams = {
  client: DynamicsCRMClient;
  leadId: string;
  createAccount: boolean;
  createContact: boolean;
  createOpportunity: boolean;
  existingAccountId?: string;
};

type QualifySummary = {
  leadId: string;
  accountId: string | null;
  contactId: string | null;
  opportunityId: string | null;
  createdEntities: { entityType: string; id: string }[];
};

type FieldSpec = {
  key: string;
  label: string;
  kind: 'text' | 'long_text' | 'number' | 'date';
  requiredOnCreate?: boolean;
};

type LookupSpec = {
  key: string;
  label: string;
  description: string;
  entitySet: string;
  bind: string;
};

type SearchOption = {
  value: string;
  label: string;
  column: string;
};

type SalesEntity = {
  entitySet: string;
  logicalName: string;
  primaryId: string;
  label: string;
  fields: FieldSpec[];
  lookups: LookupSpec[];
  searchBy: SearchOption[];
  exclusiveLookups?: string[];
};

type FindFilterParams = {
  entity: SalesEntity;
  searchBy: unknown;
  value: unknown;
  match: unknown;
};

export const FIND_RESULT_LIMIT = 50;

export const salesEntities = {
  CONTACT,
  ACCOUNT,
  LEAD,
  OPPORTUNITY,
  fieldProps,
  buildBody,
  findFilter,
  findProps,
  summarizeQualify,
  qualifyLead,
  statusReason,
  readNumber,
  readDate,
};

export type { SalesEntity };
