import { createAction } from '@activepieces/pieces-framework';
import { hunterAuth } from '../auth';
import { QueryValue, apiKeyOf, isRecord, optionalInteger, optionalText } from '../common/client';
import { hunterOutputSchemas } from '../common/output-schemas';
import {
  companyFilterProp,
  companySizeFilterProp,
  countryCodeFilterProp,
  customAttributesFilterProp,
  emailFilterProp,
  firstNameFilterProp,
  industryFilterProp,
  lastActivityAtFilterProp,
  lastContactedAtFilterProp,
  lastNameFilterProp,
  leadsListDropdownProp,
  limitProp,
  linkedinUrlFilterProp,
  offsetProp,
  phoneNumberFilterProp,
  positionFilterProp,
  queryProp,
  sendingStatusProp,
  sourceFilterProp,
  syncStatusProp,
  twitterFilterProp,
  verificationStatusProp,
  websiteFilterProp,
} from '../common/props';
import { hunterRequests } from '../common/requests';

export const searchLeadsAction = createAction({
  auth: hunterAuth,
  name: 'search-leads',
  classification: 'SEARCH',
  displayName: 'Search Leads',
  description: 'List and filter leads in the account.',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists leads in Hunter, newest first, optionally filtered by email, name, company, list, sync/sending/verification status (several values allowed), activity dates, custom attributes or a free-text query, with limit (1-1000, default 20) and offset paging. count is the number of leads matching the filters (all pages); total is the number of leads in the whole account. Uses no credits. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    leads_list_id: leadsListDropdownProp,
    email: emailFilterProp,
    first_name: firstNameFilterProp,
    last_name: lastNameFilterProp,
    position: positionFilterProp,
    company: companyFilterProp,
    industry: industryFilterProp,
    website: websiteFilterProp,
    country_code: countryCodeFilterProp,
    company_size: companySizeFilterProp,
    source: sourceFilterProp,
    twitter: twitterFilterProp,
    linkedin_url: linkedinUrlFilterProp,
    phone_number: phoneNumberFilterProp,
    sync_status: syncStatusProp,
    sending_status: sendingStatusProp,
    verification_status: verificationStatusProp,
    last_activity_at: lastActivityAtFilterProp,
    last_contacted_at: lastContactedAtFilterProp,
    custom_attributes: customAttributesFilterProp,
    query: queryProp,
    limit: limitProp,
    offset: offsetProp,
  },
  outputSchema: hunterOutputSchemas.leadSearch,
  async run(context) {
    const values = context.propsValue;
    const text = Object.fromEntries(
      TEXT_FILTERS.map((key) => [key, optionalText(Reflect.get(values, key))]),
    );
    const query: Record<string, QueryValue> = {
      ...text,
      leads_list_id: optionalText(values.leads_list_id),
      'sending_status[]': stringList(values.sending_status),
      'verification_status[]': stringList(values.verification_status),
      ...customAttributeFilters(values.custom_attributes),
      limit: optionalInteger({ value: values.limit, label: 'Limit', min: 1, max: 1000 }),
      offset: optionalInteger({ value: values.offset, label: 'Offset', min: 0, max: 100000 }),
    };
    return hunterRequests.searchLeads({ apiKey: apiKeyOf(context.auth), query });
  },
});

const TEXT_FILTERS = [
  'email',
  'first_name',
  'last_name',
  'position',
  'company',
  'industry',
  'website',
  'country_code',
  'company_size',
  'source',
  'twitter',
  'linkedin_url',
  'phone_number',
  'sync_status',
  'last_activity_at',
  'last_contacted_at',
  'query',
];

function stringList(value: unknown): string[] {
  const items = Array.isArray(value) ? value.flat() : [];
  return items.map((item) => optionalText(item)).filter((item): item is string => item !== undefined);
}

function customAttributeFilters(value: unknown): Record<string, string> {
  if (value === undefined || value === null || value === '') {
    return {};
  }
  if (!isRecord(value)) {
    throw new Error('Custom Attributes Filter must be a JSON object of slug to filter value.');
  }
  return Object.fromEntries(Object.entries(value).map(([slug, filter]) => [`custom_attributes[${slug}]`, String(filter)]));
}
