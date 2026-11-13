import { createHash } from 'node:crypto';

import type {
  GoogleAdsAudienceMember,
  GoogleAdsDateRangePreset,
  GoogleAdsMemberInput,
  GoogleAdsRecordOperation,
  GoogleAdsReportResource,
  GoogleAdsReportSpec,
  GoogleAdsResourceDefinition,
  GoogleAdsResourceType,
  GoogleAdsUserIdentifier,
} from './types';

function normalizeCustomerId(value: string): string {
  const digits = String(value ?? '')
    .trim()
    .replace(/^customers\//, '')
    .replace(/[-\s]/g, '');
  if (!/^\d{10}$/.test(digits)) {
    throw new Error(`Invalid Google Ads customer ID "${value}": expected 10 digits (dashes optional), e.g. 123-456-7890.`);
  }
  return digits;
}

function assertGaql(query: string): string {
  const trimmed = String(query ?? '').trim();
  if (!/^select\s/i.test(trimmed)) {
    throw new Error('The query must be a GAQL SELECT statement, e.g. "SELECT campaign.id, campaign.name FROM campaign".');
  }
  return trimmed;
}

function resourceDefinition(type: string): GoogleAdsResourceDefinition {
  const def = RESOURCES.find((resource) => resource.type === type);
  if (def === undefined) {
    throw new Error(`Unknown resource type "${type}". Expected one of: ${RESOURCES.map((r) => r.type).join(', ')}.`);
  }
  return def;
}

function resourceNameFor({ def, customerId, identifier }: { def: GoogleAdsResourceDefinition; customerId: string; identifier: string }): string {
  const value = String(identifier ?? '').trim();
  const idPattern = def.compositeIdHint ? COMPOSITE_ID : SIMPLE_ID;
  if (value.startsWith('customers/')) {
    const match = RESOURCE_NAME.exec(value);
    if (match === null || match[2] !== def.collection || !idPattern.test(match[3])) {
      throw new Error(`"${value}" is not a ${def.label.toLowerCase()} resource name (expected customers/<customerId>/${def.collection}/${def.compositeIdHint ?? '<id>'}).`);
    }
    if (match[1] !== customerId) {
      throw new Error(
        `${def.label} ${value} belongs to customer ${match[1]}, but the selected customer is ${customerId}. Select customer ${match[1]} or use a ${def.label.toLowerCase()} of customer ${customerId}.`
      );
    }
    return value;
  }
  if (!idPattern.test(value)) {
    throw new Error(
      def.compositeIdHint
        ? `${def.label} ids look like ${def.compositeIdHint} (e.g. 987654321~112233445566); got "${value}".`
        : `${def.label} id must be numeric or a full resource name; got "${value}".`
    );
  }
  return `customers/${customerId}/${def.collection}/${value}`;
}

function idFromResourceName(resourceName: string | undefined): string | null {
  const last = resourceName?.split('/').pop();
  return last ? last : null;
}

function updateMaskFor(record: Record<string, unknown>): string {
  const paths = Object.entries(record)
    .filter(([key]) => key !== 'resourceName')
    .flatMap(([key, child]) => leafPaths({ value: child, path: key }));
  if (paths.length === 0) {
    throw new Error('Nothing to update: the record has no fields besides resourceName.');
  }
  return paths.join(',');
}

function buildOperation({ def, operation }: { def: GoogleAdsResourceDefinition; operation: GoogleAdsRecordOperation }): Record<string, unknown> {
  return { [def.operationKey]: operation };
}

function newestRecordsQuery({ def, limit }: { def: GoogleAdsResourceDefinition; limit: number }): string {
  const conditions = [kindFilter(def), def.statusField ? `${def.statusField} != 'REMOVED'` : undefined].filter(Boolean);
  const where = conditions.length > 0 ? ` WHERE ${conditions.join(' AND ')}` : '';
  return `SELECT ${def.fields.join(', ')} FROM ${def.type}${where} ORDER BY ${def.idField} DESC LIMIT ${limit}`;
}

function recordsAfterIdQuery({ def, afterId }: { def: GoogleAdsResourceDefinition; afterId: string }): string {
  if (!/^\d+$/.test(afterId)) {
    throw new Error(`Invalid checkpoint id "${afterId}": expected a numeric Google Ads id.`);
  }
  const conditions = [kindFilter(def), def.statusField ? `${def.statusField} != 'REMOVED'` : undefined, `${def.idField} > ${afterId}`].filter(Boolean);
  return `SELECT ${def.fields.join(', ')} FROM ${def.type} WHERE ${conditions.join(' AND ')} ORDER BY ${def.idField} ASC`;
}

function recordsByResourceNamesQuery({ def, resourceNames }: { def: GoogleAdsResourceDefinition; resourceNames: string[] }): string {
  const pattern = new RegExp(`^customers/\\d+/${def.collection}/\\d+(~\\d+)?$`);
  const invalid = resourceNames.find((name) => !pattern.test(name));
  if (invalid !== undefined) {
    throw new Error(`"${invalid}" is not a ${def.label.toLowerCase()} resource name.`);
  }
  const fields = def.kind === undefined || def.fields.includes(def.kind.field) ? def.fields : [...def.fields, def.kind.field];
  return `SELECT ${fields.join(', ')} FROM ${def.type} WHERE ${def.type}.resource_name IN (${resourceNames.map((name) => `'${name}'`).join(', ')})`;
}

function recordByResourceNameQuery({ def, resourceName }: { def: GoogleAdsResourceDefinition; resourceName: string }): string {
  return `SELECT ${def.fields.join(', ')} FROM ${def.type} WHERE ${def.type}.resource_name = '${resourceName}' LIMIT 1`;
}

function buildReportQuery(spec: GoogleAdsReportSpec): string {
  const resource = REPORT_RESOURCES[spec.resource];
  if (!resource) {
    throw new Error(`Unknown report resource "${spec.resource}". Expected one of: ${Object.keys(REPORT_RESOURCES).join(', ')}.`);
  }
  const fields = clean(spec.fields);
  const metrics = clean(spec.metrics);
  const select = [
    ...(fields.length > 0 ? fields : resource.entityFields),
    ...(spec.segmentByDate ? ['segments.date'] : []),
    ...(metrics.length > 0 ? metrics : DEFAULT_METRICS),
  ];
  const unique = select.filter((f, i) => select.indexOf(f) === i);
  const conditions = [dateCondition(spec), spec.where?.trim() || null].filter((c): c is string => Boolean(c));
  const where = conditions.length > 0 ? ` WHERE ${conditions.join(' AND ')}` : '';
  const orderBy = spec.orderBy?.trim() ? ` ORDER BY ${spec.orderBy.trim()}` : '';
  return `SELECT ${unique.join(', ')} FROM ${spec.resource}${where}${orderBy}`;
}

function flattenRow(row: Record<string, unknown>, prefix = ''): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(row).flatMap(([key, value]) => {
      const path = prefix ? `${prefix}.${snake(key)}` : snake(key);
      return typeof value === 'object' && value !== null && !Array.isArray(value)
        ? Object.entries(flattenRow(Object.fromEntries(Object.entries(value)), path))
        : [[path, value]];
    })
  );
}

function sha256(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

function normalizeEmail(email: string): string {
  const value = email.trim().toLowerCase();
  const at = value.lastIndexOf('@');
  if (at <= 0) {
    throw new Error(`"${email}" is not an e-mail address.`);
  }
  const user = value.slice(0, at);
  const domain = value.slice(at + 1);
  const isGmail = domain === 'gmail.com' || domain === 'googlemail.com';
  return `${isGmail ? user.replace(/\./g, '') : user}@${domain}`;
}

function normalizePhone(phone: string): string {
  const digits = phone.replace(/[^\d]/g, '');
  if (digits.length < 8) {
    throw new Error(`"${phone}" is not a phone number in E.164 form (country code + number, e.g. +5511999999999).`);
  }
  return `+${digits}`;
}

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function identifiersFor(member: GoogleAdsMemberInput): GoogleAdsUserIdentifier[] {
  const email: GoogleAdsUserIdentifier[] = member.email?.trim() ? [{ emailAddress: sha256(normalizeEmail(member.email)) }] : [];
  const phone: GoogleAdsUserIdentifier[] = member.phone?.trim() ? [{ phoneNumber: sha256(normalizePhone(member.phone)) }] : [];
  return [...email, ...phone, ...addressIdentifiers(member)];
}

function buildMemberBatches({ members, limit }: { members: GoogleAdsMemberInput[]; limit: number }): { batches: GoogleAdsAudienceMember[][]; identifiers: number } {
  if (!Array.isArray(members) || members.length === 0) {
    throw new Error('At least one member is required.');
  }
  const payloads = members.map((member, index) => {
    const userIdentifiers = identifiersFor(member ?? {});
    if (userIdentifiers.length === 0) {
      throw new Error(`Member #${index + 1} has no identifier (e-mail, phone or full address).`);
    }
    return { userData: { userIdentifiers } };
  });
  const identifiers = payloads.reduce((total, payload) => total + payload.userData.userIdentifiers.length, 0);
  const batches = Array.from({ length: Math.ceil(payloads.length / limit) }, (_, batch) => payloads.slice(batch * limit, batch * limit + limit));
  return { batches, identifiers };
}

function toMemberInput(value: unknown): GoogleAdsMemberInput {
  if (typeof value !== 'object' || value === null) {
    return {};
  }
  const fields: Record<string, unknown> = Object.fromEntries(Object.entries(value));
  const text = (key: string): string | undefined => {
    const field = fields[key];
    return typeof field === 'string' ? field : undefined;
  };
  return {
    email: text('email'),
    phone: text('phone'),
    firstName: text('firstName'),
    lastName: text('lastName'),
    countryCode: text('countryCode'),
    postalCode: text('postalCode'),
  };
}

function userListIdFrom({ userList, customerId }: { userList: string; customerId: string }): string {
  const value = String(userList ?? '').trim();
  if (/^\d+$/.test(value)) {
    return value;
  }
  const match = /^customers\/(\d+)\/userLists\/(\d+)$/.exec(value);
  if (!match) {
    throw new Error(`"${value}" is not a user list id or resource name. Use a numeric user list id or a resource name like customers/1234567890/userLists/55.`);
  }
  const [, listCustomerId, id] = match;
  const selectedCustomerId = normalizeCustomerId(customerId);
  if (listCustomerId !== selectedCustomerId) {
    throw new Error(
      `Audience list ${value} belongs to customer ${listCustomerId}, but the selected customer is ${selectedCustomerId}. Select customer ${listCustomerId} or pick an audience list of customer ${selectedCustomerId}.`
    );
  }
  return id;
}

function assertAllowedUrl(url: unknown): void {
  if (typeof url !== 'string' || !(url.startsWith('http://') || url.startsWith('https://'))) {
    return;
  }
  if (!ALLOWED_ORIGINS.includes(originOf(url) ?? '')) {
    throw new Error(
      `Custom API Call only sends your Google Ads credentials to ${ALLOWED_ORIGINS.join(' or ')}; got "${url}". Use a path relative to ${ALLOWED_ORIGINS[0]} (e.g. /v25/customers/1234567890/googleAds:search) or a full URL on one of those hosts.`
    );
  }
}

function originOf(url: string): string | null {
  try {
    const parsed = new URL(url);
    return parsed.username || parsed.password ? null : parsed.origin;
  } catch {
    return null;
  }
}

function formatCustomerId(id: string): string {
  return id.replace(/^(\d{3})(\d{3})(\d{4})$/, '$1-$2-$3');
}

function addressIdentifiers(member: GoogleAdsMemberInput): GoogleAdsUserIdentifier[] {
  const parts = {
    firstName: member.firstName?.trim() ?? '',
    lastName: member.lastName?.trim() ?? '',
    countryCode: member.countryCode?.trim() ?? '',
    postalCode: member.postalCode?.trim() ?? '',
  };
  if (Object.values(parts).every((part) => part === '')) {
    return [];
  }
  const missing = Object.entries(parts)
    .filter(([, part]) => part === '')
    .map(([key]) => key);
  if (missing.length > 0) {
    throw new Error(`Address identifiers need first name, last name, country code and postal code together (missing: ${missing.join(', ')}).`);
  }
  return [
    {
      address: {
        givenName: sha256(normalizeName(parts.firstName)),
        familyName: sha256(normalizeName(parts.lastName)),
        regionCode: parts.countryCode.toUpperCase(),
        postalCode: parts.postalCode,
      },
    },
  ];
}

function leafPaths({ value, path }: { value: unknown; path: string }): string[] {
  if (typeof value === 'object' && value !== null && !Array.isArray(value) && Object.keys(value).length > 0) {
    return Object.entries(value).flatMap(([key, child]) => leafPaths({ value: child, path: `${path}.${key}` }));
  }
  return [path];
}

function kindFilter(def: GoogleAdsResourceDefinition): string | undefined {
  return def.kind === undefined ? undefined : `${def.kind.field} = '${def.kind.value}'`;
}

function dateCondition(spec: GoogleAdsReportSpec): string | null {
  const range = spec.dateRange ?? 'LAST_30_DAYS';
  if (range === 'ALL_TIME') return null;
  if (range === 'CUSTOM') {
    if (!spec.startDate || !spec.endDate || !DATE.test(spec.startDate) || !DATE.test(spec.endDate)) {
      throw new Error('A custom date range needs Start Date and End Date as YYYY-MM-DD.');
    }
    return `segments.date BETWEEN '${spec.startDate}' AND '${spec.endDate}'`;
  }
  if (!DATE_RANGE_PRESETS.includes(range)) {
    throw new Error(`Unknown date range "${range}".`);
  }
  return `segments.date DURING ${range}`;
}

function clean(values: string[] | undefined): string[] {
  return (values ?? []).map((v) => String(v).trim()).filter((v) => v.length > 0);
}

function snake(segment: string): string {
  return segment.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
}

const ALLOWED_ORIGINS = ['https://googleads.googleapis.com', 'https://datamanager.googleapis.com'];
const CID = 'customers/1234567890';
const RESOURCE_NAME = /^customers\/(\d+)\/([A-Za-z]+)\/([^/]+)$/;
const SIMPLE_ID = /^\d+$/;
const COMPOSITE_ID = /^\d+~\d+$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

const RESOURCES: GoogleAdsResourceDefinition[] = [
  {
    type: 'campaign',
    label: 'Campaign',
    operationKey: 'campaignOperation',
    resultKey: 'campaignResult',
    collection: 'campaigns',
    idField: 'campaign.id',
    statusField: 'campaign.status',
    fields: [
      'campaign.id',
      'campaign.name',
      'campaign.status',
      'campaign.advertising_channel_type',
      'campaign.bidding_strategy_type',
      'campaign.campaign_budget',
      'campaign.start_date_time',
      'campaign.end_date_time',
      'campaign.resource_name',
    ],
    createExample: {
      name: 'Spring sale',
      status: 'PAUSED',
      advertisingChannelType: 'SEARCH',
      campaignBudget: `${CID}/campaignBudgets/1122334455`,
      manualCpc: {},
      networkSettings: { targetGoogleSearch: true, targetSearchNetwork: true },
      containsEuPoliticalAdvertising: 'DOES_NOT_CONTAIN_EU_POLITICAL_ADVERTISING',
    },
    read: (row) => row.campaign,
  },
  {
    type: 'ad_group',
    label: 'Ad group',
    operationKey: 'adGroupOperation',
    resultKey: 'adGroupResult',
    collection: 'adGroups',
    idField: 'ad_group.id',
    statusField: 'ad_group.status',
    fields: ['ad_group.id', 'ad_group.name', 'ad_group.status', 'ad_group.type', 'ad_group.campaign', 'ad_group.cpc_bid_micros', 'ad_group.resource_name'],
    createExample: {
      name: 'Running shoes',
      status: 'ENABLED',
      type: 'SEARCH_STANDARD',
      campaign: `${CID}/campaigns/123456789`,
      cpcBidMicros: '1000000',
    },
    read: (row) => row.adGroup,
  },
  {
    type: 'ad_group_ad',
    label: 'Ad',
    operationKey: 'adGroupAdOperation',
    resultKey: 'adGroupAdResult',
    collection: 'adGroupAds',
    idField: 'ad_group_ad.ad.id',
    statusField: 'ad_group_ad.status',
    fields: [
      'ad_group_ad.ad.id',
      'ad_group_ad.ad.name',
      'ad_group_ad.ad.type',
      'ad_group_ad.ad.final_urls',
      'ad_group_ad.status',
      'ad_group_ad.ad_group',
      'ad_group_ad.resource_name',
    ],
    compositeIdHint: '<adGroupId>~<adId>',
    changeEventType: 'AD_GROUP_AD',
    createExample: {
      adGroup: `${CID}/adGroups/987654321`,
      status: 'PAUSED',
      ad: {
        finalUrls: ['https://www.example.com/shoes'],
        responsiveSearchAd: {
          headlines: [{ text: 'Running shoes' }, { text: 'Free shipping' }, { text: 'Shop today' }],
          descriptions: [{ text: 'Lightweight shoes for every runner.' }, { text: 'Order now and run tomorrow.' }],
        },
      },
    },
    read: (row) => (row.adGroupAd ? { ...row.adGroupAd, id: row.adGroupAd.ad?.id } : undefined),
  },
  {
    type: 'ad_group_criterion',
    label: 'Keyword',
    operationKey: 'adGroupCriterionOperation',
    resultKey: 'adGroupCriterionResult',
    collection: 'adGroupCriteria',
    idField: 'ad_group_criterion.criterion_id',
    statusField: 'ad_group_criterion.status',
    fields: [
      'ad_group_criterion.criterion_id',
      'ad_group_criterion.keyword.text',
      'ad_group_criterion.keyword.match_type',
      'ad_group_criterion.status',
      'ad_group_criterion.ad_group',
      'ad_group_criterion.resource_name',
    ],
    kind: { field: 'ad_group_criterion.type', value: 'KEYWORD' },
    compositeIdHint: '<adGroupId>~<criterionId>',
    changeEventType: 'AD_GROUP_CRITERION',
    createExample: {
      adGroup: `${CID}/adGroups/987654321`,
      status: 'ENABLED',
      keyword: { text: 'running shoes', matchType: 'PHRASE' },
    },
    read: (row) => (row.adGroupCriterion ? { ...row.adGroupCriterion, id: row.adGroupCriterion.criterionId } : undefined),
  },
  {
    type: 'user_list',
    label: 'Audience list',
    operationKey: 'userListOperation',
    resultKey: 'userListResult',
    collection: 'userLists',
    idField: 'user_list.id',
    fields: [
      'user_list.id',
      'user_list.name',
      'user_list.description',
      'user_list.type',
      'user_list.membership_status',
      'user_list.size_for_display',
      'user_list.size_for_search',
      'user_list.resource_name',
    ],
    createExample: {
      name: 'Newsletter subscribers',
      description: 'Customers who opted in to the newsletter',
      membershipLifeSpan: '30',
      crmBasedUserList: { uploadKeyType: 'CONTACT_INFO' },
    },
    read: (row) => row.userList,
  },
];

const REPORT_RESOURCES: Record<GoogleAdsReportResource, { label: string; entityFields: string[] }> = {
  customer: { label: 'Account', entityFields: ['customer.id', 'customer.descriptive_name'] },
  campaign: { label: 'Campaign', entityFields: ['campaign.id', 'campaign.name', 'campaign.status'] },
  ad_group: { label: 'Ad group', entityFields: ['ad_group.id', 'ad_group.name', 'ad_group.status', 'campaign.name'] },
  ad_group_ad: { label: 'Ad', entityFields: ['ad_group_ad.ad.id', 'ad_group_ad.ad.type', 'ad_group_ad.status', 'ad_group.name'] },
  keyword_view: {
    label: 'Keyword',
    entityFields: ['ad_group_criterion.criterion_id', 'ad_group_criterion.keyword.text', 'ad_group_criterion.keyword.match_type', 'ad_group.name'],
  },
  search_term_view: { label: 'Search term', entityFields: ['search_term_view.search_term', 'ad_group.name', 'campaign.name'] },
};

const REPORT_RESOURCE_TYPES: GoogleAdsReportResource[] = ['customer', 'campaign', 'ad_group', 'ad_group_ad', 'keyword_view', 'search_term_view'];

const DEFAULT_METRICS = [
  'metrics.impressions',
  'metrics.clicks',
  'metrics.ctr',
  'metrics.average_cpc',
  'metrics.cost_micros',
  'metrics.conversions',
  'metrics.conversions_value',
];

const DATE_RANGE_PRESETS: GoogleAdsDateRangePreset[] = [
  'TODAY',
  'YESTERDAY',
  'LAST_7_DAYS',
  'LAST_14_DAYS',
  'LAST_30_DAYS',
  'THIS_WEEK_SUN_TODAY',
  'THIS_WEEK_MON_TODAY',
  'LAST_WEEK_SUN_SAT',
  'LAST_WEEK_MON_SUN',
  'THIS_MONTH',
  'LAST_MONTH',
  'LAST_BUSINESS_WEEK',
];

const RESOURCE_TYPES: GoogleAdsResourceType[] = RESOURCES.map((resource) => resource.type);

export const googleAdsUtils = {
  normalizeCustomerId,
  formatCustomerId,
  assertAllowedUrl,
  assertGaql,
  resourceDefinition,
  resourceNameFor,
  idFromResourceName,
  updateMaskFor,
  buildOperation,
  newestRecordsQuery,
  recordsAfterIdQuery,
  recordsByResourceNamesQuery,
  recordByResourceNameQuery,
  buildReportQuery,
  flattenRow,
  sha256,
  normalizeEmail,
  normalizePhone,
  normalizeName,
  identifiersFor,
  buildMemberBatches,
  toMemberInput,
  userListIdFrom,
  resources: RESOURCES,
  resourceTypes: RESOURCE_TYPES,
  reportResources: REPORT_RESOURCES,
  reportResourceTypes: REPORT_RESOURCE_TYPES,
  defaultMetrics: DEFAULT_METRICS,
  dateRangePresets: DATE_RANGE_PRESETS,
};
