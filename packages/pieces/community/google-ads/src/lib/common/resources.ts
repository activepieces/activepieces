import { isRecord } from './client';

export function resourceDefinition(type: string): ResourceDefinition {
  if (!isResourceType(type)) {
    throw new Error(`Unknown resource type "${type}". Expected one of: ${RESOURCE_TYPES.join(', ')}.`);
  }
  return RESOURCES[type];
}

export function resourceNameFor({ def, customerId, identifier }: { def: ResourceDefinition; customerId: string; identifier: string }): string {
  const value = String(identifier ?? '').trim();
  if (value.startsWith('customers/')) {
    if (!value.includes(`/${def.collection}/`)) {
      throw new Error(`"${value}" is not a ${def.label.toLowerCase()} resource name (expected customers/<id>/${def.collection}/<id>).`);
    }
    return value;
  }
  if (def.compositeIdHint) {
    if (!/^\d+~\d+$/.test(value)) {
      throw new Error(`${def.label} ids look like ${def.compositeIdHint} (e.g. 987654321~112233445566); got "${value}".`);
    }
  } else if (!/^\d+$/.test(value)) {
    throw new Error(`${def.label} id must be numeric or a full resource name; got "${value}".`);
  }
  return `customers/${customerId}/${def.collection}/${value}`;
}

export function idFromResourceName(resourceName: string | undefined): string | null {
  if (!resourceName) return null;
  const last = resourceName.split('/').pop();
  return last && last.length > 0 ? last : null;
}

export function updateMaskFor(record: Record<string, unknown>): string {
  const paths = Object.entries(record)
    .filter(([key]) => key !== 'resourceName')
    .flatMap(([key, child]) => leafPaths({ value: child, path: key }));
  if (paths.length === 0) {
    throw new Error('Nothing to update: the record has no fields besides resourceName.');
  }
  return paths.join(',');
}

export function readField({ row, gaqlPath }: { row: Record<string, unknown>; gaqlPath: string }): unknown {
  return gaqlPath.split('.').reduce<unknown>((current, segment) => (isRecord(current) ? current[camel(segment)] : undefined), row);
}

export function buildOperation({ def, operation }: { def: ResourceDefinition; operation: RecordOperation }): Record<string, unknown> {
  return { [def.operationKey]: operation };
}

export function newestRecordsQuery({ def, limit = 100 }: { def: ResourceDefinition; limit?: number }): string {
  const conditions = [def.filter, def.statusField ? `${def.statusField} != 'REMOVED'` : undefined].filter(Boolean);
  const where = conditions.length > 0 ? ` WHERE ${conditions.join(' AND ')}` : '';
  return `SELECT ${def.fields.join(', ')} FROM ${def.type}${where} ORDER BY ${def.idField} DESC LIMIT ${limit}`;
}

export function recordsAfterIdQuery({ def, afterId }: { def: ResourceDefinition; afterId: string }): string {
  if (!/^\d+$/.test(afterId)) {
    throw new Error(`Invalid checkpoint id "${afterId}": expected a numeric Google Ads id.`);
  }
  const conditions = [def.filter, def.statusField ? `${def.statusField} != 'REMOVED'` : undefined, `${def.idField} > ${afterId}`].filter(Boolean);
  return `SELECT ${def.fields.join(', ')} FROM ${def.type} WHERE ${conditions.join(' AND ')} ORDER BY ${def.idField} ASC`;
}

export function recordsByResourceNamesQuery({ def, resourceNames }: { def: ResourceDefinition; resourceNames: string[] }): string {
  const pattern = new RegExp(`^customers/\\d+/${def.collection}/\\d+(~\\d+)?$`);
  const invalid = resourceNames.find((name) => !pattern.test(name));
  if (invalid !== undefined) {
    throw new Error(`"${invalid}" is not a ${def.label.toLowerCase()} resource name.`);
  }
  const list = resourceNames.map((name) => `'${name}'`).join(', ');
  const conditions = [def.filter, def.statusField ? `${def.statusField} != 'REMOVED'` : undefined, `${def.type}.resource_name IN (${list})`].filter(Boolean);
  return `SELECT ${def.fields.join(', ')} FROM ${def.type} WHERE ${conditions.join(' AND ')}`;
}

export function recordByResourceNameQuery({ def, resourceName }: { def: ResourceDefinition; resourceName: string }): string {
  return `SELECT ${def.fields.join(', ')} FROM ${def.type} WHERE ${def.type}.resource_name = '${resourceName}' LIMIT 1`;
}

function isResourceType(type: string): type is ResourceType {
  return RESOURCE_TYPES.some((candidate) => candidate === type);
}

function leafPaths({ value, path }: { value: unknown; path: string }): string[] {
  if (isRecord(value) && Object.keys(value).length > 0) {
    return Object.entries(value).flatMap(([key, child]) => leafPaths({ value: child, path: `${path}.${key}` }));
  }
  return [path];
}

function camel(segment: string): string {
  return segment.replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase());
}

const CID = 'customers/1234567890';

export const RESOURCE_TYPES = ['campaign', 'ad_group', 'ad_group_ad', 'ad_group_criterion', 'user_list'] as const;

export const RESOURCES: Record<ResourceType, ResourceDefinition> = {
  campaign: {
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
  },
  ad_group: {
    type: 'ad_group',
    label: 'Ad group',
    operationKey: 'adGroupOperation',
    resultKey: 'adGroupResult',
    collection: 'adGroups',
    idField: 'ad_group.id',
    statusField: 'ad_group.status',
    fields: [
      'ad_group.id',
      'ad_group.name',
      'ad_group.status',
      'ad_group.type',
      'ad_group.campaign',
      'ad_group.cpc_bid_micros',
      'ad_group.resource_name',
    ],
    createExample: {
      name: 'Running shoes',
      status: 'ENABLED',
      type: 'SEARCH_STANDARD',
      campaign: `${CID}/campaigns/123456789`,
      cpcBidMicros: '1000000',
    },
  },
  ad_group_ad: {
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
  },
  ad_group_criterion: {
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
    filter: "ad_group_criterion.type = 'KEYWORD'",
    compositeIdHint: '<adGroupId>~<criterionId>',
    changeEventType: 'AD_GROUP_CRITERION',
    createExample: {
      adGroup: `${CID}/adGroups/987654321`,
      status: 'ENABLED',
      keyword: { text: 'running shoes', matchType: 'PHRASE' },
    },
  },
  user_list: {
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
  },
};

export const resourceTypeOptions = RESOURCE_TYPES.map((type) => ({
  label: RESOURCES[type].label,
  value: type,
}));

export type ResourceType = (typeof RESOURCE_TYPES)[number];

export type ResourceDefinition = {
  type: ResourceType;
  label: string;
  operationKey: string;
  resultKey: string;
  collection: string;
  idField: string;
  fields: string[];
  filter?: string;
  statusField?: string;
  compositeIdHint?: string;
  changeEventType?: string;
  createExample: Record<string, unknown>;
};

export type RecordOperation =
  | { create: Record<string, unknown> }
  | { update: Record<string, unknown>; updateMask: string }
  | { remove: string };
