import { HttpMethod } from '@activepieces/pieces-common';
import {
  HunterApiError,
  HunterRecord,
  QueryValue,
  hunterApi,
  isNotFound,
  isRecord,
  numericId,
  optionalInteger,
  optionalText,
  requireText,
} from './client';

export const hunterRequests = {
  getLead,
  createLead,
  upsertLead,
  updateLead,
  deleteLead,
  searchLeads,
  listLeadsPage,
  buildLeadBody,
  addRecipients,
  removeRecipients,
  listCampaigns,
  listLeadsLists,
  getLeadsList,
  createLeadsList,
  domainSearch,
  findEmail,
  verifyEmail,
  countEmails,
  getAccount,
  enrichPersonAndCompany,
  enrichCompany,
  numericIdList,
  emailList,
};

export const LEAD_TEXT_FIELDS = [
  'email',
  'first_name',
  'last_name',
  'position',
  'company',
  'company_industry',
  'company_size',
  'website',
  'country_code',
  'linkedin_url',
  'phone_number',
  'twitter',
  'notes',
  'source',
];

export const CLEARABLE_LEAD_FIELDS = LEAD_TEXT_FIELDS.filter((field) => field !== 'email');

const MAX_RECIPIENTS = 50;

const VERIFY_DEADLINE_MS = 60_000;

const VERIFY_POLL_MS = 5_000;

function dataOf(body: unknown): HunterRecord {
  return isRecord(body) && isRecord(body['data']) ? body['data'] : {};
}

function metaOf(body: unknown): HunterRecord {
  return isRecord(body) && isRecord(body['meta']) ? body['meta'] : {};
}

function listOf({ record, key }: { record: HunterRecord; key: string }): HunterRecord[] {
  const value = record[key];
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

function stringItems(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function numberOr({ value, fallback }: { value: unknown; fallback: number }): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function numericIdList({ value, label }: { value: unknown; label: string }): number[] {
  const items = Array.isArray(value) ? value.flat() : value === undefined || value === null || value === '' ? [] : [value];
  const ids = items
    .map((item) => (isRecord(item) && 'id' in item ? item['id'] : item))
    .filter((item) => optionalText(item) !== undefined)
    .map((item) => numericId({ value: item, label }));
  return [...new Set(ids)];
}

function emailList({ value, label }: { value: unknown; label: string }): string[] {
  const items = Array.isArray(value) ? value.flat() : typeof value === 'string' ? value.split(',') : [];
  const emails = items.map((item) => optionalText(item)).filter((item): item is string => item !== undefined);
  for (const email of emails) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error(`${label}: "${email.slice(0, 100)}" is not a valid email address.`);
    }
  }
  return [...new Set(emails)];
}

function buildLeadBody({ props, clearFields, requireEmail }: { props: HunterRecord; clearFields: unknown; requireEmail: boolean }): HunterRecord {
  const body: HunterRecord = {};
  for (const field of LEAD_TEXT_FIELDS) {
    const text = optionalText(props[field]);
    if (text !== undefined) {
      body[field] = text;
    }
  }
  if (requireEmail && body['email'] === undefined) {
    throw new Error('Email is required.');
  }
  const score = optionalInteger({ value: props['confidence_score'], label: 'Confidence Score', min: 0, max: 100 });
  if (score !== undefined) {
    body['confidence_score'] = score;
  }
  const listIds = [
    ...numericIdList({ value: props['leads_list_id'], label: 'Leads List' }),
    ...numericIdList({ value: props['leads_list_ids'], label: 'Leads List IDs' }),
  ];
  if (listIds.length > 0) {
    body['leads_list_ids'] = [...new Set(listIds)];
  }
  const customAttributes = props['custom_attributes'];
  if (customAttributes !== undefined && customAttributes !== null && customAttributes !== '') {
    if (!isRecord(customAttributes)) {
      throw new Error('Custom Attributes must be a JSON object, e.g. { "customer_id": "cus-1234" }.');
    }
    body['custom_attributes'] = customAttributes;
  }
  const clears = Array.isArray(clearFields) ? clearFields.map(String) : [];
  for (const field of clears) {
    if (!CLEARABLE_LEAD_FIELDS.includes(field) && field !== 'confidence_score') {
      throw new Error(`Cannot clear "${field.slice(0, 50)}". Clearable fields: ${[...CLEARABLE_LEAD_FIELDS, 'confidence_score'].join(', ')}.`);
    }
    if (body[field] !== undefined) {
      throw new Error(`"${field}" is both set and marked to clear. Pick one.`);
    }
    body[field] = null;
  }
  return body;
}

async function getLead({ apiKey, leadId }: { apiKey: string; leadId: unknown }): Promise<HunterRecord> {
  const id = numericId({ value: leadId, label: 'Lead ID' });
  const response = await hunterApi.request({ apiKey, method: HttpMethod.GET, path: `/leads/${id}`, operation: 'get lead' });
  return dataOf(response.body);
}

async function createLead({ apiKey, body }: { apiKey: string; body: HunterRecord }): Promise<HunterRecord> {
  const response = await hunterApi.request({ apiKey, method: HttpMethod.POST, path: '/leads', operation: 'create lead', body });
  return dataOf(response.body);
}

async function upsertLead({ apiKey, body }: { apiKey: string; body: HunterRecord }): Promise<HunterRecord> {
  const response = await hunterApi.request({ apiKey, method: HttpMethod.PUT, path: '/leads', operation: 'upsert lead', body });
  const lead = dataOf(response.body);
  return { created: response.status === 201, lead };
}

async function updateLead({ apiKey, leadId, body }: { apiKey: string; leadId: unknown; body: HunterRecord }): Promise<HunterRecord> {
  const id = numericId({ value: leadId, label: 'Lead ID' });
  if (Object.keys(body).length === 0) {
    throw new Error('Set at least one field to update or clear.');
  }
  await hunterApi.request({ apiKey, method: HttpMethod.PUT, path: `/leads/${id}`, operation: 'update lead', body });
  const lead = await getLead({ apiKey, leadId: id });
  return { success: true, lead };
}

async function deleteLead({ apiKey, leadId, missingOk }: { apiKey: string; leadId: unknown; missingOk: boolean }): Promise<HunterRecord> {
  const id = numericId({ value: leadId, label: 'Lead ID' });
  try {
    await hunterApi.request({ apiKey, method: HttpMethod.DELETE, path: `/leads/${id}`, operation: 'delete lead' });
    return { success: true, deleted: true, lead_id: id };
  } catch (error) {
    if (missingOk && isNotFound(error)) {
      return { success: true, deleted: false, lead_id: id };
    }
    if (isNotFound(error)) {
      throw new Error(`Lead ${id} was not found. It may already be deleted.`);
    }
    throw error;
  }
}

async function searchLeads({ apiKey, query }: { apiKey: string; query: Record<string, QueryValue> }): Promise<HunterRecord> {
  const response = await hunterApi.request({ apiKey, method: HttpMethod.GET, path: '/leads', operation: 'search leads', query });
  const meta = metaOf(response.body);
  const params = isRecord(meta['params']) ? meta['params'] : {};
  const leads = listOf({ record: dataOf(response.body), key: 'leads' });
  return {
    leads,
    count: numberOr({ value: meta['count'], fallback: leads.length }),
    total: numberOr({ value: meta['total'], fallback: leads.length }),
    limit: numberOr({ value: params['limit'], fallback: numberOr({ value: query['limit'], fallback: 20 }) }),
    offset: numberOr({ value: params['offset'], fallback: numberOr({ value: query['offset'], fallback: 0 }) }),
  };
}

async function listLeadsPage({ apiKey, limit, offset }: { apiKey: string; limit: number; offset: number }): Promise<HunterRecord[]> {
  const response = await hunterApi.request({ apiKey, method: HttpMethod.GET, path: '/leads', operation: 'list leads', query: { limit, offset } });
  return listOf({ record: dataOf(response.body), key: 'leads' });
}

async function addRecipients({ apiKey, campaignId, emails, leadIds }: { apiKey: string; campaignId: unknown; emails: unknown; leadIds: unknown }): Promise<HunterRecord> {
  const id = numericId({ value: campaignId, label: 'Campaign ID' });
  const emailValues = emailList({ value: emails, label: 'Emails' });
  const leadIdValues = numericIdList({ value: leadIds, label: 'Lead IDs' });
  if (emailValues.length === 0 && leadIdValues.length === 0) {
    throw new Error('Provide at least one email or lead ID.');
  }
  if (emailValues.length > MAX_RECIPIENTS || leadIdValues.length > MAX_RECIPIENTS) {
    throw new Error(`Hunter accepts at most ${MAX_RECIPIENTS} emails and ${MAX_RECIPIENTS} lead IDs per call.`);
  }
  const body = {
    ...(emailValues.length > 0 ? { emails: emailValues } : {}),
    ...(leadIdValues.length > 0 ? { lead_ids: leadIdValues } : {}),
  };
  const response = await hunterApi.request({ apiKey, method: HttpMethod.POST, path: `/campaigns/${id}/recipients`, operation: 'add campaign recipients', body });
  const data = dataOf(response.body);
  return {
    recipients_added: numberOr({ value: data['recipients_added'], fallback: 0 }),
    skipped_recipients: listOf({ record: data, key: 'skipped_recipients' }),
  };
}

async function removeRecipients({ apiKey, campaignId, emails }: { apiKey: string; campaignId: unknown; emails: unknown }): Promise<HunterRecord> {
  const id = numericId({ value: campaignId, label: 'Campaign ID' });
  const emailValues = emailList({ value: emails, label: 'Emails' });
  if (emailValues.length === 0) {
    throw new Error('Provide at least one email to remove.');
  }
  if (emailValues.length > MAX_RECIPIENTS) {
    throw new Error(`Hunter accepts at most ${MAX_RECIPIENTS} emails per call.`);
  }
  const response = await hunterApi.request({
    apiKey,
    method: HttpMethod.DELETE,
    path: `/campaigns/${id}/recipients`,
    operation: 'remove campaign recipients',
    body: { emails: emailValues },
  });
  const data = dataOf(response.body);
  return {
    recipients_removed: stringItems(data['recipients_removed']),
    recipients_canceled: stringItems(data['recipients_canceled']),
    messages_canceled: numberOr({ value: data['messages_canceled'], fallback: 0 }),
    skipped_recipients: listOf({ record: data, key: 'skipped_recipients' }),
  };
}

async function listCampaigns({ apiKey, query }: { apiKey: string; query: Record<string, QueryValue> }): Promise<HunterRecord> {
  const response = await hunterApi.request({ apiKey, method: HttpMethod.GET, path: '/campaigns', operation: 'list campaigns', query });
  const campaigns = listOf({ record: dataOf(response.body), key: 'campaigns' });
  const meta = metaOf(response.body);
  return {
    campaigns,
    count: campaigns.length,
    limit: numberOr({ value: meta['limit'], fallback: numberOr({ value: query['limit'], fallback: 20 }) }),
    offset: numberOr({ value: meta['offset'], fallback: numberOr({ value: query['offset'], fallback: 0 }) }),
  };
}

async function listLeadsLists({ apiKey, limit, offset }: { apiKey: string; limit: number | undefined; offset: number | undefined }): Promise<HunterRecord> {
  const response = await hunterApi.request({ apiKey, method: HttpMethod.GET, path: '/leads_lists', operation: 'list leads lists', query: { limit, offset } });
  const leadsLists = listOf({ record: dataOf(response.body), key: 'leads_lists' });
  const meta = metaOf(response.body);
  return {
    leads_lists: leadsLists,
    total: numberOr({ value: meta['total'], fallback: leadsLists.length }),
    limit: limit ?? 20,
    offset: offset ?? 0,
  };
}

async function getLeadsList({ apiKey, leadsListId, limit, offset }: { apiKey: string; leadsListId: unknown; limit: number | undefined; offset: number | undefined }): Promise<HunterRecord> {
  const id = numericId({ value: leadsListId, label: 'Leads List ID' });
  const response = await hunterApi.request({ apiKey, method: HttpMethod.GET, path: `/leads_lists/${id}`, operation: 'get leads list', query: { limit, offset } });
  return dataOf(response.body);
}

async function createLeadsList({ apiKey, name }: { apiKey: string; name: unknown }): Promise<HunterRecord> {
  const response = await hunterApi.request({
    apiKey,
    method: HttpMethod.POST,
    path: '/leads_lists',
    operation: 'create leads list',
    body: { name: requireText({ value: name, label: 'Name' }) },
  });
  return dataOf(response.body);
}

async function domainSearch({ apiKey, query }: { apiKey: string; query: Record<string, QueryValue> }): Promise<HunterRecord> {
  const response = await hunterApi.request({ apiKey, method: HttpMethod.GET, path: '/domain-search', operation: 'domain search', query });
  const data = dataOf(response.body);
  const meta = metaOf(response.body);
  return {
    ...data,
    emails: listOf({ record: data, key: 'emails' }),
    results: numberOr({ value: meta['results'], fallback: 0 }),
    limit: numberOr({ value: meta['limit'], fallback: numberOr({ value: query['limit'], fallback: 10 }) }),
    offset: numberOr({ value: meta['offset'], fallback: numberOr({ value: query['offset'], fallback: 0 }) }),
  };
}

async function findEmail({ apiKey, query }: { apiKey: string; query: Record<string, QueryValue> }): Promise<HunterRecord> {
  const response = await hunterApi.request({ apiKey, method: HttpMethod.GET, path: '/email-finder', operation: 'find email', query });
  return dataOf(response.body);
}

async function verifyEmail({ apiKey, email, wait = hunterApi.sleep, now = Date.now }: { apiKey: string; email: string; wait?: (ms: number) => Promise<void>; now?: () => number }): Promise<HunterRecord> {
  const deadline = now() + VERIFY_DEADLINE_MS;
  for (;;) {
    const response = await hunterApi.request({ apiKey, method: HttpMethod.GET, path: '/email-verifier', operation: 'verify email', query: { email } });
    if (response.status === 222) {
      throw new HunterApiError({ operation: 'verify email', status: 222, responseBody: response.body });
    }
    if (response.status !== 202) {
      return dataOf(response.body);
    }
    if (now() + VERIFY_POLL_MS > deadline) {
      throw new Error('Hunter is still verifying this email after 60 seconds. Run the step again later; repeat checks of the same email are not charged again.');
    }
    await wait(VERIFY_POLL_MS);
  }
}

async function countEmails({ apiKey, query }: { apiKey: string; query: Record<string, QueryValue> }): Promise<HunterRecord> {
  const response = await hunterApi.request({ apiKey, method: HttpMethod.GET, path: '/email-count', operation: 'count emails', query });
  return dataOf(response.body);
}

async function getAccount({ apiKey }: { apiKey: string }): Promise<HunterRecord> {
  const response = await hunterApi.request({ apiKey, method: HttpMethod.GET, path: '/account', operation: 'get account' });
  return dataOf(response.body);
}

async function enrichPersonAndCompany({ apiKey, email }: { apiKey: string; email: string }): Promise<HunterRecord> {
  try {
    const response = await hunterApi.request({ apiKey, method: HttpMethod.GET, path: '/combined/find', operation: 'enrich person and company', query: { email } });
    const data = dataOf(response.body);
    return { found: true, person: isRecord(data['person']) ? data['person'] : null, company: isRecord(data['company']) ? data['company'] : null };
  } catch (error) {
    if (isNotFound(error)) {
      return { found: false, person: null, company: null };
    }
    throw error;
  }
}

async function enrichCompany({ apiKey, domain }: { apiKey: string; domain: string }): Promise<HunterRecord> {
  try {
    const response = await hunterApi.request({ apiKey, method: HttpMethod.GET, path: '/companies/find', operation: 'enrich company', query: { domain } });
    return { found: true, company: dataOf(response.body) };
  } catch (error) {
    if (isNotFound(error)) {
      return { found: false, company: null };
    }
    throw error;
  }
}
