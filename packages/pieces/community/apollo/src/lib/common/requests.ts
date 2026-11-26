import { HttpMethod } from '@activepieces/pieces-common';
import { ApolloApiError, ApolloRecord, QueryValue, apolloApi, isRecord, recordsOf } from './client';

function segment({ value, label }: { value: unknown; label: string }): string {
  const text = value === undefined || value === null ? '' : String(value).trim();
  if (text === '') {
    throw new Error(`${label} is required.`);
  }
  return encodeURIComponent(text);
}

function get({ apiKey, path, operation, query }: { apiKey: string; path: string; operation: string; query?: Record<string, QueryValue> }): Promise<ApolloRecord> {
  return apolloApi.request({ apiKey, method: HttpMethod.GET, path, operation, query });
}

function post({ apiKey, path, operation, query, body }: { apiKey: string; path: string; operation: string; query?: Record<string, QueryValue>; body?: unknown }): Promise<ApolloRecord> {
  return apolloApi.request({ apiKey, method: HttpMethod.POST, path, operation, query, body });
}

function patch({ apiKey, path, operation, body }: { apiKey: string; path: string; operation: string; body: unknown }): Promise<ApolloRecord> {
  return apolloApi.request({ apiKey, method: HttpMethod.PATCH, path, operation, body });
}

function getProfile({ apiKey, includeCreditUsage }: { apiKey: string; includeCreditUsage: boolean }): Promise<ApolloRecord> {
  return get({ apiKey, path: '/users/api_profile', operation: 'get API profile', query: includeCreditUsage ? { include_credit_usage: true } : undefined });
}

function searchPeople({ apiKey, query }: { apiKey: string; query: Record<string, QueryValue> }): Promise<ApolloRecord> {
  return post({ apiKey, path: '/mixed_people/api_search', operation: 'people search', query });
}

function matchPerson({ apiKey, query }: { apiKey: string; query: Record<string, QueryValue> }): Promise<ApolloRecord> {
  return post({ apiKey, path: '/people/match', operation: 'people enrichment', query });
}

function searchOrganizations({ apiKey, query }: { apiKey: string; query: Record<string, QueryValue> }): Promise<ApolloRecord> {
  return post({ apiKey, path: '/mixed_companies/search', operation: 'organization search', query });
}

function enrichOrganization({ apiKey, query }: { apiKey: string; query: Record<string, QueryValue> }): Promise<ApolloRecord> {
  return get({ apiKey, path: '/organizations/enrich', operation: 'organization enrichment', query });
}

function getOrganization({ apiKey, organizationId }: { apiKey: string; organizationId: unknown }): Promise<ApolloRecord> {
  return get({ apiKey, path: `/organizations/${segment({ value: organizationId, label: 'Organization ID' })}`, operation: 'get organization' });
}

function listJobPostings({ apiKey, organizationId, page, perPage }: { apiKey: string; organizationId: unknown; page: number | undefined; perPage: number | undefined }): Promise<ApolloRecord> {
  return get({
    apiKey,
    path: `/organizations/${segment({ value: organizationId, label: 'Organization ID' })}/job_postings`,
    operation: 'organization job postings',
    query: { page, per_page: perPage },
  });
}

function searchNews({ apiKey, query }: { apiKey: string; query: Record<string, QueryValue> }): Promise<ApolloRecord> {
  return post({ apiKey, path: '/news_articles/search', operation: 'news articles search', query });
}

function searchContacts({ apiKey, body }: { apiKey: string; body: ApolloRecord }): Promise<ApolloRecord> {
  return post({ apiKey, path: '/contacts/search', operation: 'contact search', body });
}

function getContact({ apiKey, contactId }: { apiKey: string; contactId: unknown }): Promise<ApolloRecord> {
  return get({ apiKey, path: `/contacts/${segment({ value: contactId, label: 'Contact ID' })}`, operation: 'get contact' });
}

function createContact({ apiKey, body }: { apiKey: string; body: ApolloRecord }): Promise<ApolloRecord> {
  return post({ apiKey, path: '/contacts', operation: 'create contact', body });
}

function updateContact({ apiKey, contactId, body }: { apiKey: string; contactId: unknown; body: ApolloRecord }): Promise<ApolloRecord> {
  return patch({ apiKey, path: `/contacts/${segment({ value: contactId, label: 'Contact ID' })}`, operation: 'update contact', body });
}

async function findContactByEmail({ apiKey, email }: { apiKey: string; email: string }): Promise<{ contact: ApolloRecord | null; otherContactIds: string[] }> {
  const wanted = email.trim().toLowerCase();
  const matches: ApolloRecord[] = [];
  for (let page = 1; page <= MAX_EMAIL_LOOKUP_PAGES; page++) {
    const response = await searchContacts({ apiKey, body: { q_keywords: email.trim(), page, per_page: 100 } });
    const contacts = recordsOf(response['contacts']);
    matches.push(...contacts.filter((contact) => contactEmails(contact).includes(wanted)));
    if (contacts.length < 100) {
      return { contact: matches[0] ?? null, otherContactIds: matches.slice(1).map((contact) => String(contact['id'])) };
    }
  }
  throw new Error(`More than ${MAX_EMAIL_LOOKUP_PAGES * 100} Apollo contacts match this email as a keyword; use Search Contacts with narrower filters.`);
}

function listContactStages({ apiKey }: { apiKey: string }): Promise<ApolloRecord> {
  return get({ apiKey, path: '/contact_stages', operation: 'list contact stages' });
}

function searchAccounts({ apiKey, body }: { apiKey: string; body: ApolloRecord }): Promise<ApolloRecord> {
  return post({ apiKey, path: '/accounts/search', operation: 'account search', body });
}

function getAccount({ apiKey, accountId }: { apiKey: string; accountId: unknown }): Promise<ApolloRecord> {
  return get({ apiKey, path: `/accounts/${segment({ value: accountId, label: 'Account ID' })}`, operation: 'get account' });
}

function createAccount({ apiKey, body }: { apiKey: string; body: ApolloRecord }): Promise<ApolloRecord> {
  return post({ apiKey, path: '/accounts', operation: 'create account', body });
}

function updateAccount({ apiKey, accountId, body }: { apiKey: string; accountId: unknown; body: ApolloRecord }): Promise<ApolloRecord> {
  return patch({ apiKey, path: `/accounts/${segment({ value: accountId, label: 'Account ID' })}`, operation: 'update account', body });
}

function listAccountStages({ apiKey }: { apiKey: string }): Promise<ApolloRecord> {
  return get({ apiKey, path: '/account_stages', operation: 'list account stages' });
}

async function listLists({ apiKey }: { apiKey: string }): Promise<ApolloRecord[]> {
  const response: unknown = await apolloApi.request<unknown>({ apiKey, method: HttpMethod.GET, path: '/labels', operation: 'list lists' });
  if (Array.isArray(response)) {
    return recordsOf(response);
  }
  return isRecord(response) ? recordsOf(response['labels']) : [];
}

function createList({ apiKey, name, modality }: { apiKey: string; name: string; modality: string }): Promise<ApolloRecord> {
  return post({ apiKey, path: '/labels', operation: 'create list', body: { name, modality } });
}

function updateList({ apiKey, listId, name }: { apiKey: string; listId: unknown; name: string }): Promise<ApolloRecord> {
  return patch({ apiKey, path: `/labels/${segment({ value: listId, label: 'List ID' })}`, operation: 'update list', body: { name } });
}

async function resolveList({ apiKey, reference, modality }: { apiKey: string; reference: string; modality: string }): Promise<ApolloRecord> {
  const lists = await listLists({ apiKey });
  const byId = lists.find((list) => String(list['id']) === reference);
  if (byId) {
    if (byId['modality'] !== modality) {
      throw new Error(`List "${String(byId['name'])}" holds ${String(byId['modality'])}, not ${modality}. Pick a ${modality} list from List Lists.`);
    }
    return byId;
  }
  const wanted = reference.toLowerCase();
  const byName = lists.filter((list) => list['modality'] === modality && String(list['name'] ?? '').trim().toLowerCase() === wanted);
  if (byName.length === 0) {
    throw new Error(`No ${modality} list with ID or name "${reference.slice(0, 80)}" exists. Use List Lists to find it, or Create List to make it first (Apollo would otherwise create a new list from a mistyped name).`);
  }
  if (byName.length > 1) {
    throw new Error(`More than one ${modality} list is named "${reference.slice(0, 80)}". Pass the list ID from List Lists instead.`);
  }
  return byName[0];
}

function changeListMembers({ apiKey, listName, entityIds, modality, action }: { apiKey: string; listName: string; entityIds: string[]; modality: string; action: 'add' | 'remove' }): Promise<ApolloRecord> {
  const path = action === 'add' ? '/labels/add_entity_ids_to_label_names' : '/labels/remove_entity_ids_from_label_names';
  return post({ apiKey, path, operation: action === 'add' ? 'add records to list' : 'remove records from list', body: { entity_ids: entityIds, label_names: [listName], modality, async: false } });
}

function searchSequences({ apiKey, query }: { apiKey: string; query: Record<string, QueryValue> }): Promise<ApolloRecord> {
  return post({ apiKey, path: '/emailer_campaigns/search', operation: 'sequence search', query });
}

function listEmailAccounts({ apiKey }: { apiKey: string }): Promise<ApolloRecord> {
  return get({ apiKey, path: '/email_accounts', operation: 'list email accounts' });
}

async function addContactsToSequence({ apiKey, sequenceId, contactIds, emailAccountId, status, userId }: { apiKey: string; sequenceId: string; contactIds: string[]; emailAccountId: string; status: string; userId: string | undefined }): Promise<SequenceAddResult> {
  const response = await post({
    apiKey,
    path: `/emailer_campaigns/${segment({ value: sequenceId, label: 'Sequence ID' })}/add_contact_ids`,
    operation: 'add contacts to sequence',
    query: {
      emailer_campaign_id: sequenceId,
      'contact_ids[]': contactIds,
      send_email_from_email_account_id: emailAccountId,
      status,
      user_id: userId,
    },
  });
  const skippedMap = isRecord(response['skipped_contact_ids']) ? response['skipped_contact_ids'] : {};
  const reasons = Object.entries(skippedMap).map(([contactId, reason]) => ({ contact_id: contactId, reason: typeof reason === 'string' ? reason : JSON.stringify(reason) }));
  const toCheck = reasons.filter((entry) => entry.reason === ACTIVE_IN_OTHER_SEQUENCES).slice(0, MAX_SEQUENCE_MEMBERSHIP_LOOKUPS).map((entry) => entry.contact_id);
  const membership = new Map<string, boolean | null>();
  for (const contactId of toCheck) {
    membership.set(contactId, await isContactInSequence({ apiKey, contactId, sequenceId }));
  }
  const skipped = reasons.map((entry) => ({ ...entry, already_in_sequence: alreadyInSequence({ entry, membership }) }));
  const skippedIds = new Set(skipped.map((entry) => entry.contact_id));
  return {
    sequence_id: sequenceId,
    status,
    added_contact_ids: contactIds.filter((contactId) => !skippedIds.has(contactId)),
    skipped,
  };
}

function alreadyInSequence({ entry, membership }: { entry: { contact_id: string; reason: string }; membership: Map<string, boolean | null> }): boolean | null {
  if (ALREADY_IN_SEQUENCE.includes(entry.reason)) {
    return true;
  }
  if (entry.reason === ACTIVE_IN_OTHER_SEQUENCES) {
    return membership.has(entry.contact_id) ? membership.get(entry.contact_id) ?? null : null;
  }
  return false;
}

async function isContactInSequence({ apiKey, contactId, sequenceId }: { apiKey: string; contactId: string; sequenceId: string }): Promise<boolean | null> {
  try {
    const response = await getContact({ apiKey, contactId });
    const contact = isRecord(response['contact']) ? response['contact'] : {};
    const ids = Array.isArray(contact['emailer_campaign_ids']) ? contact['emailer_campaign_ids'].map((id) => String(id)) : [];
    const statusIds = recordsOf(contact['contact_campaign_statuses']).map((entry) => String(entry['emailer_campaign_id'] ?? ''));
    return [...ids, ...statusIds].includes(sequenceId);
  } catch (error) {
    if (error instanceof ApolloApiError) {
      return null;
    }
    throw error;
  }
}

function requireSequenceProgress(result: SequenceAddResult): SequenceAddResult {
  const blocking = result.skipped.filter((entry) => entry.already_in_sequence !== true);
  if (result.added_contact_ids.length === 0 && blocking.length > 0) {
    throw new Error(`Apollo added none of the contacts to the sequence: ${blocking.map((entry) => `${entry.contact_id}: ${entry.reason}`).join('; ').slice(0, 500)}`);
  }
  return result;
}

function removeOrStopContacts({ apiKey, sequenceIds, contactIds, mode }: { apiKey: string; sequenceIds: string[]; contactIds: string[]; mode: string }): Promise<ApolloRecord> {
  return post({
    apiKey,
    path: '/emailer_campaigns/remove_or_stop_contact_ids',
    operation: 'update contact status in sequence',
    query: { 'emailer_campaign_ids[]': sequenceIds, 'contact_ids[]': contactIds, mode },
  });
}

function listUsers({ apiKey, page, perPage }: { apiKey: string; page: number; perPage: number }): Promise<ApolloRecord> {
  return get({ apiKey, path: '/users/search', operation: 'list users', query: { page, per_page: perPage } });
}

function createTask({ apiKey, body }: { apiKey: string; body: ApolloRecord }): Promise<ApolloRecord> {
  return post({ apiKey, path: '/tasks', operation: 'create task', body });
}

function searchTasks({ apiKey, query }: { apiKey: string; query: Record<string, QueryValue> }): Promise<ApolloRecord> {
  return post({ apiKey, path: '/tasks/search', operation: 'task search', query });
}

function getTask({ apiKey, taskId }: { apiKey: string; taskId: unknown }): Promise<ApolloRecord> {
  return get({ apiKey, path: `/tasks/${segment({ value: taskId, label: 'Task ID' })}`, operation: 'get task' });
}

function listDeals({ apiKey, query }: { apiKey: string; query: Record<string, QueryValue> }): Promise<ApolloRecord> {
  return get({ apiKey, path: '/opportunities/search', operation: 'list deals', query });
}

function getDeal({ apiKey, dealId }: { apiKey: string; dealId: unknown }): Promise<ApolloRecord> {
  return get({ apiKey, path: `/opportunities/${segment({ value: dealId, label: 'Deal ID' })}`, operation: 'get deal' });
}

function createDeal({ apiKey, body }: { apiKey: string; body: ApolloRecord }): Promise<ApolloRecord> {
  return post({ apiKey, path: '/opportunities', operation: 'create deal', body });
}

function updateDeal({ apiKey, dealId, body }: { apiKey: string; dealId: unknown; body: ApolloRecord }): Promise<ApolloRecord> {
  return patch({ apiKey, path: `/opportunities/${segment({ value: dealId, label: 'Deal ID' })}`, operation: 'update deal', body });
}

function listDealStages({ apiKey }: { apiKey: string }): Promise<ApolloRecord> {
  return get({ apiKey, path: '/opportunity_stages', operation: 'list deal stages' });
}

function listCustomFields({ apiKey }: { apiKey: string }): Promise<ApolloRecord> {
  return get({ apiKey, path: '/fields', operation: 'list custom fields', query: { source: 'custom' } });
}

function searchOutreachEmails({ apiKey, query }: { apiKey: string; query: Record<string, QueryValue> }): Promise<ApolloRecord> {
  return get({ apiKey, path: '/emailer_messages/search', operation: 'outreach email search', query });
}

function getEmailContent({ apiKey, ids, bodyFormat }: { apiKey: string; ids: string[]; bodyFormat: string }): Promise<ApolloRecord> {
  return post({ apiKey, path: '/emailer_messages/get_content', operation: 'get email content', body: { ids, body_format: bodyFormat } });
}

function getEmailSendStatus({ apiKey, id }: { apiKey: string; id: string }): Promise<ApolloRecord> {
  return post({ apiKey, path: '/emailer_messages/email_send_status', operation: 'check email send status', body: { id } });
}

function searchCalls({ apiKey, query }: { apiKey: string; query: Record<string, QueryValue> }): Promise<ApolloRecord> {
  return get({ apiKey, path: '/phone_calls/search', operation: 'call search', query });
}

function contactEmails(contact: ApolloRecord): string[] {
  const primary = typeof contact['email'] === 'string' ? [contact['email']] : [];
  const extra = recordsOf(contact['contact_emails']).map((entry) => entry['email']).filter((value): value is string => typeof value === 'string');
  return [...primary, ...extra].map((value) => value.trim().toLowerCase());
}

function pick({ record, fields }: { record: unknown; fields: readonly string[] }): ApolloRecord {
  const source = isRecord(record) ? record : {};
  return Object.fromEntries(fields.map((field) => [field, normalise({ key: field, value: source[field] })]));
}

function normalise({ key, value }: { key: string; value: unknown }): unknown {
  if (value === undefined) {
    return null;
  }
  if ((key === 'id' || key.endsWith('_id')) && typeof value === 'number') {
    return String(value);
  }
  if (key.endsWith('_ids') && Array.isArray(value)) {
    return value.map((item) => (typeof item === 'number' ? String(item) : item));
  }
  return value;
}

function nested({ record, key, field }: { record: ApolloRecord; key: string; field: string }): unknown {
  const child = record[key];
  return isRecord(child) && child[field] !== undefined ? child[field] : null;
}

function mapPersonSearchResult(record: unknown): ApolloRecord {
  const person = isRecord(record) ? record : {};
  return { ...pick({ record: person, fields: PERSON_SEARCH_FIELDS }), organization_name: nested({ record: person, key: 'organization', field: 'name' }) };
}

function mapPerson(record: unknown): ApolloRecord {
  const person = isRecord(record) ? record : {};
  return {
    ...pick({ record: person, fields: PERSON_FIELDS }),
    organization_name: nested({ record: person, key: 'organization', field: 'name' }),
    organization_domain: nested({ record: person, key: 'organization', field: 'primary_domain' }),
  };
}

function mapOrganization(record: unknown): ApolloRecord {
  const organization = isRecord(record) ? record : {};
  return { ...pick({ record: organization, fields: ORGANIZATION_FIELDS }), phone: organizationPhone(organization) };
}

function mapOrganizationSearchResult({ record, isAccount }: { record: unknown; isAccount: boolean }): ApolloRecord {
  const organization = isRecord(record) ? record : {};
  const organizationId = isAccount ? organization['organization_id'] : organization['id'];
  const accountId = isAccount ? organization['id'] : organization['account_id'];
  return {
    organization_id: normalise({ key: 'organization_id', value: organizationId }),
    account_id: normalise({ key: 'account_id', value: accountId }),
    ...pick({ record: organization, fields: ORGANIZATION_SEARCH_FIELDS }),
    phone: organizationPhone(organization),
  };
}

function organizationPhone(organization: ApolloRecord): unknown {
  const primary = organization['primary_phone'];
  if (isRecord(primary) && typeof primary['number'] === 'string') {
    return primary['number'];
  }
  return organization['phone'] ?? organization['sanitized_phone'] ?? null;
}

function mapContact(record: unknown): ApolloRecord {
  const contact = isRecord(record) ? record : {};
  return {
    ...pick({ record: contact, fields: CONTACT_FIELDS }),
    phone: contact['sanitized_phone'] ?? null,
    list_ids: normalise({ key: 'list_ids', value: contact['label_ids'] ?? [] }),
    sequence_ids: normalise({ key: 'sequence_ids', value: contact['emailer_campaign_ids'] ?? [] }),
  };
}

function mapAccount(record: unknown): ApolloRecord {
  const account = isRecord(record) ? record : {};
  return { ...pick({ record: account, fields: ACCOUNT_FIELDS }), list_ids: normalise({ key: 'list_ids', value: account['label_ids'] ?? [] }) };
}

function mapDeal(record: unknown): ApolloRecord {
  const deal = isRecord(record) ? record : {};
  return {
    ...pick({ record: deal, fields: DEAL_FIELDS }),
    created_at: deal['created_at'] ?? deal['opportunity_created_at'] ?? null,
    currency: nested({ record: deal, key: 'currency', field: 'iso_code' }),
    account_name: nested({ record: deal, key: 'account', field: 'name' }),
  };
}

function mapTask(record: unknown): ApolloRecord {
  return pick({ record, fields: TASK_FIELDS });
}

function mapStage(record: unknown): ApolloRecord {
  return pick({ record, fields: STAGE_FIELDS });
}

function mapDealStage(record: unknown): ApolloRecord {
  return pick({ record, fields: DEAL_STAGE_FIELDS });
}

function mapList(record: unknown): ApolloRecord {
  return pick({ record, fields: LIST_FIELDS });
}

function mapSequence(record: unknown): ApolloRecord {
  return pick({ record, fields: SEQUENCE_FIELDS });
}

function mapEmailAccount(record: unknown): ApolloRecord {
  return pick({ record, fields: EMAIL_ACCOUNT_FIELDS });
}

function mapUser(record: unknown): ApolloRecord {
  return pick({ record, fields: USER_FIELDS });
}

function mapField(record: unknown): ApolloRecord {
  return pick({ record, fields: FIELD_FIELDS });
}

function mapJobPosting(record: unknown): ApolloRecord {
  return pick({ record, fields: JOB_POSTING_FIELDS });
}

function mapNewsArticle(record: unknown): ApolloRecord {
  return pick({ record, fields: NEWS_FIELDS });
}

function mapOutreachEmail(record: unknown): ApolloRecord {
  return pick({ record, fields: OUTREACH_EMAIL_FIELDS });
}

function mapEmailContent(record: unknown): ApolloRecord {
  return pick({ record, fields: EMAIL_CONTENT_FIELDS });
}

function mapEmailSendStatus(record: unknown): ApolloRecord {
  return pick({ record, fields: EMAIL_SEND_STATUS_FIELDS });
}

function mapCall(record: unknown): ApolloRecord {
  return pick({ record, fields: CALL_FIELDS });
}

function pageInfo({ body, page, perPage, returned }: { body: ApolloRecord; page: number; perPage: number; returned: number }): PageInfo {
  const pagination = isRecord(body['pagination']) ? body['pagination'] : {};
  const total = numberOrNull(pagination['total_entries']) ?? numberOrNull(body['total_entries']);
  const totalPages = numberOrNull(pagination['total_pages']);
  const lastReachablePage = Math.min(totalPages ?? MAX_PAGE, MAX_PAGE);
  const hasMore = totalPages !== null ? page < lastReachablePage : total !== null ? page * perPage < Math.min(total, MAX_PAGE * perPage) : returned >= perPage && page < MAX_PAGE;
  return { total_entries: total, page, per_page: perPage, has_more: hasMore };
}

function numberOrNull(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return null;
}

const MAX_PAGE = 500;

const MAX_EMAIL_LOOKUP_PAGES = 5;

const ALREADY_IN_SEQUENCE = ['contacts_already_exists_in_current_campaign', 'contact_already_exists_in_current_campaign'];

const ACTIVE_IN_OTHER_SEQUENCES = 'contacts_active_in_other_campaigns';

const MAX_SEQUENCE_MEMBERSHIP_LOOKUPS = 10;

const PERSON_SEARCH_FIELDS = ['id', 'first_name', 'last_name_obfuscated', 'title', 'has_email', 'has_direct_phone', 'has_city', 'has_state', 'has_country', 'last_refreshed_at'];

const PERSON_FIELDS = [
  'id',
  'first_name',
  'last_name',
  'name',
  'title',
  'headline',
  'email',
  'email_status',
  'linkedin_url',
  'twitter_url',
  'github_url',
  'facebook_url',
  'photo_url',
  'city',
  'state',
  'country',
  'seniority',
  'departments',
  'organization_id',
  'contact_id',
];

const ORGANIZATION_FIELDS = [
  'id',
  'name',
  'primary_domain',
  'website_url',
  'linkedin_url',
  'twitter_url',
  'facebook_url',
  'logo_url',
  'founded_year',
  'industry',
  'keywords',
  'estimated_num_employees',
  'annual_revenue',
  'annual_revenue_printed',
  'total_funding',
  'total_funding_printed',
  'latest_funding_stage',
  'latest_funding_round_date',
  'raw_address',
  'city',
  'state',
  'country',
  'short_description',
  'technology_names',
  'publicly_traded_symbol',
  'account_id',
];

const ORGANIZATION_SEARCH_FIELDS = ['name', 'primary_domain', 'website_url', 'linkedin_url', 'logo_url', 'founded_year'];

const CONTACT_FIELDS = [
  'id',
  'first_name',
  'last_name',
  'name',
  'title',
  'email',
  'email_status',
  'organization_name',
  'organization_id',
  'account_id',
  'contact_stage_id',
  'owner_id',
  'person_id',
  'linkedin_url',
  'present_raw_address',
  'city',
  'state',
  'country',
  'time_zone',
  'source',
  'created_at',
  'updated_at',
  'last_activity_date',
  'typed_custom_fields',
];

const ACCOUNT_FIELDS = [
  'id',
  'name',
  'domain',
  'organization_id',
  'account_stage_id',
  'owner_id',
  'phone',
  'raw_address',
  'linkedin_url',
  'source',
  'created_at',
  'typed_custom_fields',
];

const DEAL_FIELDS = [
  'id',
  'name',
  'amount',
  'owner_id',
  'account_id',
  'opportunity_stage_id',
  'opportunity_pipeline_id',
  'stage_name',
  'closed_date',
  'is_closed',
  'is_won',
  'deal_probability',
  'forecast_category',
  'source',
  'created_at',
  'last_activity_date',
  'typed_custom_fields',
];

const TASK_FIELDS = [
  'id',
  'type',
  'status',
  'priority',
  'title',
  'note',
  'due_at',
  'created_at',
  'completed_at',
  'skipped_at',
  'user_id',
  'contact_id',
  'account_id',
  'opportunity_id',
  'emailer_campaign_id',
  'creator_id',
];

const STAGE_FIELDS = ['id', 'name', 'display_name', 'display_order', 'category'];

const DEAL_STAGE_FIELDS = ['id', 'name', 'display_order', 'is_won', 'is_closed', 'probability', 'opportunity_pipeline_id', 'type'];

const LIST_FIELDS = ['id', 'name', 'modality', 'cached_count', 'created_at', 'updated_at', 'user_id'];

const SEQUENCE_FIELDS = ['id', 'name', 'active', 'archived', 'num_steps', 'created_at', 'last_used_at', 'user_id', 'unique_scheduled', 'unique_delivered', 'unique_opened', 'unique_replied', 'unique_bounced'];

const EMAIL_ACCOUNT_FIELDS = ['id', 'user_id', 'email', 'type', 'active', 'default', 'provider_display_name', 'last_synced_at', 'created_at', 'active_campaigns_count'];

const USER_FIELDS = ['id', 'name', 'first_name', 'last_name', 'email', 'title', 'deleted', 'created_at'];

const FIELD_FIELDS = ['id', 'label', 'modality', 'type', 'source'];

const JOB_POSTING_FIELDS = ['id', 'title', 'url', 'city', 'state', 'country', 'posted_at', 'last_seen_at'];

const NEWS_FIELDS = ['id', 'title', 'url', 'domain', 'snippet', 'published_at', 'event_categories', 'organization_ids'];

const OUTREACH_EMAIL_FIELDS = [
  'id',
  'subject',
  'status',
  'type',
  'contact_id',
  'account_id',
  'emailer_campaign_id',
  'campaign_name',
  'emailer_step_id',
  'user_id',
  'email_account_id',
  'from_email',
  'from_name',
  'to_email',
  'to_name',
  'due_at',
  'completed_at',
  'failed_at',
  'created_at',
  'replied',
  'reply_class',
  'bounce',
  'not_sent_reason',
  'failure_reason',
];

const EMAIL_CONTENT_FIELDS = ['id', 'subject', 'body', 'body_format', 'status', 'sent_at', 'recipients'];

const EMAIL_SEND_STATUS_FIELDS = ['id', 'status', 'message', 'completed_at', 'not_sent_reason', 'failure_reason', 'failed_at', 'retry_after_seconds'];

const CALL_FIELDS = [
  'id',
  'user_id',
  'contact_id',
  'account_id',
  'opportunity_id',
  'inbound',
  'status',
  'from_number',
  'to_number',
  'start_time',
  'end_time',
  'duration',
  'phone_call_outcome_id',
  'phone_call_purpose_id',
  'note_text',
  'conversation_id',
];

export const apolloRequests = {
  getProfile,
  searchPeople,
  matchPerson,
  searchOrganizations,
  enrichOrganization,
  getOrganization,
  listJobPostings,
  searchNews,
  searchContacts,
  getContact,
  createContact,
  updateContact,
  findContactByEmail,
  listContactStages,
  searchAccounts,
  getAccount,
  createAccount,
  updateAccount,
  listAccountStages,
  listLists,
  createList,
  updateList,
  resolveList,
  changeListMembers,
  searchSequences,
  listEmailAccounts,
  addContactsToSequence,
  requireSequenceProgress,
  removeOrStopContacts,
  listUsers,
  createTask,
  searchTasks,
  getTask,
  listDeals,
  getDeal,
  createDeal,
  updateDeal,
  listDealStages,
  listCustomFields,
  searchOutreachEmails,
  getEmailContent,
  getEmailSendStatus,
  searchCalls,
};

export const apolloMappers = {
  personSearchResult: mapPersonSearchResult,
  person: mapPerson,
  organization: mapOrganization,
  organizationSearchResult: mapOrganizationSearchResult,
  contact: mapContact,
  account: mapAccount,
  deal: mapDeal,
  task: mapTask,
  stage: mapStage,
  dealStage: mapDealStage,
  list: mapList,
  sequence: mapSequence,
  emailAccount: mapEmailAccount,
  user: mapUser,
  field: mapField,
  jobPosting: mapJobPosting,
  newsArticle: mapNewsArticle,
  outreachEmail: mapOutreachEmail,
  emailContent: mapEmailContent,
  emailSendStatus: mapEmailSendStatus,
  call: mapCall,
  pageInfo,
};

export type PageInfo = {
  total_entries: number | null;
  page: number;
  per_page: number;
  has_more: boolean;
};

export type SequenceAddResult = {
  sequence_id: string;
  status: string;
  added_contact_ids: string[];
  skipped: { contact_id: string; reason: string; already_in_sequence: boolean | null }[];
};
