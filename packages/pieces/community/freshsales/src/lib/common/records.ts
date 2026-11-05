import { freshsalesClient } from './client';

export const SUBSCRIPTION_STATUS_OPTIONS = [
  { label: 'Unsubscribed', value: '0' },
  { label: 'Subscribed', value: '1' },
  { label: 'Reported as spam', value: '2' },
  { label: 'Not sure', value: '3' },
];

export const RECORD_INCLUDES: Record<RecordEntity, string> = {
  contacts: 'sales_accounts,owner,contact_status,lifecycle_stage,territory',
  sales_accounts: 'owner,industry_type',
  deals: 'owner,sales_account,currency,deal_type',
};

export const freshsalesRecords = {
  RECORD_INCLUDES,
  isRecordEntity,
  SUBSCRIPTION_STATUS_OPTIONS,
  buildContactBody,
  buildAccountBody,
  buildDealBody,
  shapeContact,
  shapeDeal,
  shapeRecord,
  shapeTargetable,
  toNumber,
  readSalesAccountIds,
  mergeSalesAccounts,
};

function toSubscriptionStatus(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const text = String(value).trim().toLowerCase();
  const match = SUBSCRIPTION_STATUS_OPTIONS.find(
    (option) => option.value === text || option.label.toLowerCase() === text
  );
  if (!match) {
    throw new Error(
      'Subscription Status must be one of: Unsubscribed, Subscribed, Reported as spam, Not sure.'
    );
  }
  return Number(match.value);
}

function toNumber({ value, field }: { value: unknown; field: string }): number | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`${field} must be a number.`);
  }
  return parsed;
}

function buildContactBody(input: ContactInput): Record<string, unknown> {
  const salesAccountId = freshsalesClient.toId({
    value: input.sales_account_id,
    field: 'Account ID',
  });
  const custom = freshsalesClient.toCustomFields(input.custom_fields);
  return freshsalesClient.pickDefined({
    first_name: input.first_name,
    last_name: input.last_name,
    job_title: input.job_title,
    email: input.email?.trim(),
    work_number: input.work_number,
    mobile_number: input.mobile_number,
    address: input.address,
    city: input.city,
    state: input.state,
    zipcode: input.zipcode,
    country: input.country,
    territory_id: freshsalesClient.toId({ value: input.territory_id, field: 'Territory' }),
    owner_id: freshsalesClient.toId({ value: input.owner_id, field: 'Owner' }),
    subscription_status: toSubscriptionStatus(input.subscription_status),
    medium: input.medium,
    campaign_id: freshsalesClient.toId({ value: input.campaign_id, field: 'Campaign' }),
    keyword: input.keyword,
    time_zone: input.time_zone,
    facebook: input.facebook,
    twitter: input.twitter,
    linkedin: input.linkedin,
    contact_status_id: freshsalesClient.toId({
      value: input.contact_status_id,
      field: 'Contact Status',
    }),
    lifecycle_stage_id: freshsalesClient.toId({
      value: input.lifecycle_stage_id,
      field: 'Lifecycle Stage',
    }),
    lead_source_id: freshsalesClient.toId({ value: input.lead_source_id, field: 'Lead Source' }),
    sales_accounts:
      salesAccountId === undefined ? undefined : [{ id: salesAccountId, is_primary: true }],
    custom_field: custom,
  });
}

function buildAccountBody(input: AccountInput): Record<string, unknown> {
  return freshsalesClient.pickDefined({
    name: input.name,
    website: input.website,
    phone: input.phone,
    address: input.address,
    city: input.city,
    state: input.state,
    zipcode: input.zipcode,
    country: input.country,
    industry_type_id: freshsalesClient.toId({ value: input.industry_type_id, field: 'Industry Type' }),
    business_type_id: freshsalesClient.toId({ value: input.business_type_id, field: 'Business Type' }),
    number_of_employees: toNumber({ value: input.number_of_employees, field: 'Number of Employees' }),
    annual_revenue: toNumber({ value: input.annual_revenue, field: 'Annual Revenue' }),
    owner_id: freshsalesClient.toId({ value: input.owner_id, field: 'Owner' }),
    territory_id: freshsalesClient.toId({ value: input.territory_id, field: 'Territory' }),
    parent_sales_account_id: freshsalesClient.toId({
      value: input.parent_sales_account_id,
      field: 'Parent Account ID',
    }),
    custom_field: freshsalesClient.toCustomFields(input.custom_fields),
  });
}

function buildDealBody(input: DealInput): Record<string, unknown> {
  const probability = toNumber({ value: input.probability, field: 'Probability' });
  if (probability !== undefined && (probability < 0 || probability > 100)) {
    throw new Error('Probability must be between 0 and 100.');
  }
  const expectedClose = freshsalesClient.toIsoDate(input.expected_close);
  return freshsalesClient.pickDefined({
    name: input.name,
    amount: toNumber({ value: input.amount, field: 'Amount' }),
    sales_account_id: freshsalesClient.toId({ value: input.sales_account_id, field: 'Account ID' }),
    currency_id: freshsalesClient.toId({ value: input.currency_id, field: 'Currency' }),
    deal_pipeline_id: freshsalesClient.toId({ value: input.deal_pipeline_id, field: 'Pipeline' }),
    deal_stage_id: freshsalesClient.toId({ value: input.deal_stage_id, field: 'Deal Stage' }),
    deal_type_id: freshsalesClient.toId({ value: input.deal_type_id, field: 'Deal Type' }),
    owner_id: freshsalesClient.toId({ value: input.owner_id, field: 'Owner' }),
    territory_id: freshsalesClient.toId({ value: input.territory_id, field: 'Territory' }),
    lead_source_id: freshsalesClient.toId({ value: input.lead_source_id, field: 'Lead Source' }),
    expected_close: expectedClose === undefined ? undefined : expectedClose.slice(0, 10),
    probability,
    custom_field: freshsalesClient.toCustomFields(input.custom_fields),
  });
}

function shapeContact(record: Record<string, unknown>): Record<string, unknown> {
  if (record['sales_account_id'] !== undefined) {
    return record;
  }
  const accounts = record['sales_accounts'];
  if (!Array.isArray(accounts)) {
    return record;
  }
  const primary =
    accounts.find((a) => freshsalesClient.isRecord(a) && a['is_primary'] === true) ?? accounts[0];
  return Object.assign({}, record, {
    sales_account_id: freshsalesClient.isRecord(primary) ? primary['id'] ?? null : null,
  });
}

function readSalesAccountIds(body: unknown): number[] {
  if (!freshsalesClient.isRecord(body)) {
    return [];
  }
  const contact = body['contact'];
  const nested = freshsalesClient.isRecord(contact) ? contact['sales_accounts'] : undefined;
  const accounts = Array.isArray(nested) ? nested : body['sales_accounts'];
  if (!Array.isArray(accounts)) {
    return [];
  }
  const ids: number[] = [];
  for (const account of accounts) {
    if (freshsalesClient.isRecord(account)) {
      const id = Number(account['id']);
      if (account['id'] !== null && Number.isSafeInteger(id) && id > 0 && !ids.includes(id)) {
        ids.push(id);
      }
    }
  }
  return ids;
}

function mergeSalesAccounts({
  existingIds,
  primaryId,
}: {
  existingIds: number[];
  primaryId: number;
}): { id: number; is_primary: boolean }[] {
  const others = existingIds.filter((id) => id !== primaryId);
  return [
    { id: primaryId, is_primary: true },
    ...others.map((id) => ({ id, is_primary: false })),
  ];
}

function isRecordEntity(value: unknown): value is RecordEntity {
  return value === 'contacts' || value === 'sales_accounts' || value === 'deals';
}

function shapeDeal(record: Record<string, unknown>): Record<string, unknown> {
  const amount = record['amount'];
  if (typeof amount !== 'string' || amount.trim().length === 0) {
    return record;
  }
  const parsed = Number(amount);
  return Number.isFinite(parsed) ? Object.assign({}, record, { amount: parsed }) : record;
}

function shapeRecord({
  entity,
  record,
}: {
  entity: RecordEntity;
  record: Record<string, unknown>;
}): Record<string, unknown> {
  if (entity === 'contacts') {
    return shapeContact(record);
  }
  if (entity === 'deals') {
    return shapeDeal(record);
  }
  return record;
}

function shapeTargetable(record: Record<string, unknown>): Record<string, unknown> {
  if (record['targetable_type'] !== undefined) {
    return record;
  }
  const targetables = record['targetables'];
  const first = Array.isArray(targetables) ? targetables[0] : undefined;
  if (!freshsalesClient.isRecord(first)) {
    return record;
  }
  return Object.assign({}, record, {
    targetable_type: first['type'] ?? null,
    targetable_id: first['id'] ?? null,
  });
}

export type RecordEntity = 'contacts' | 'sales_accounts' | 'deals';

type Text = string | undefined | null;
type Loose = unknown;

export type ContactInput = {
  first_name?: Text;
  last_name?: Text;
  job_title?: Text;
  email?: Text;
  work_number?: Text;
  mobile_number?: Text;
  address?: Text;
  city?: Text;
  state?: Text;
  zipcode?: Text;
  country?: Text;
  territory_id?: Loose;
  owner_id?: Loose;
  subscription_status?: Loose;
  medium?: Text;
  campaign_id?: Loose;
  keyword?: Text;
  time_zone?: Text;
  facebook?: Text;
  twitter?: Text;
  linkedin?: Text;
  contact_status_id?: Loose;
  lifecycle_stage_id?: Loose;
  lead_source_id?: Loose;
  sales_account_id?: Loose;
  custom_fields?: Loose;
};

export type AccountInput = {
  name?: Text;
  website?: Text;
  phone?: Text;
  address?: Text;
  city?: Text;
  state?: Text;
  zipcode?: Text;
  country?: Text;
  industry_type_id?: Loose;
  business_type_id?: Loose;
  number_of_employees?: Loose;
  annual_revenue?: Loose;
  owner_id?: Loose;
  territory_id?: Loose;
  parent_sales_account_id?: Loose;
  custom_fields?: Loose;
};

export type DealInput = {
  name?: Text;
  amount?: Loose;
  sales_account_id?: Loose;
  currency_id?: Loose;
  deal_pipeline_id?: Loose;
  deal_stage_id?: Loose;
  deal_type_id?: Loose;
  owner_id?: Loose;
  territory_id?: Loose;
  lead_source_id?: Loose;
  expected_close?: Loose;
  probability?: Loose;
  custom_fields?: Loose;
};
