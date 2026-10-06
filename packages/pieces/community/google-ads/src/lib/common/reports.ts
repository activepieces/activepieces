import { isRecord } from './client';

export function buildReportQuery(spec: ReportSpec): string {
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
  const limit = spec.limit && spec.limit > 0 ? ` LIMIT ${Math.floor(spec.limit)}` : '';

  return `SELECT ${unique.join(', ')} FROM ${spec.resource}${where}${orderBy}${limit}`;
}

export function flattenRow(row: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(flattenEntries({ row, prefix: '' }));
}

function flattenEntries({ row, prefix }: { row: Record<string, unknown>; prefix: string }): [string, unknown][] {
  return Object.entries(row).flatMap(([key, value]): [string, unknown][] => {
    const path = prefix ? `${prefix}.${snake(key)}` : snake(key);
    return isRecord(value) ? flattenEntries({ row: value, prefix: path }) : [[path, value]];
  });
}

function dateCondition(spec: ReportSpec): string | null {
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

export const REPORT_RESOURCE_TYPES = ['customer', 'campaign', 'ad_group', 'ad_group_ad', 'keyword_view', 'search_term_view'] as const;

export const REPORT_RESOURCES: Record<ReportResource, { label: string; entityFields: string[] }> = {
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

export const DEFAULT_METRICS = [
  'metrics.impressions',
  'metrics.clicks',
  'metrics.ctr',
  'metrics.average_cpc',
  'metrics.cost_micros',
  'metrics.conversions',
  'metrics.conversions_value',
];

export const DATE_RANGE_PRESETS = [
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
] as const;

const DATE = /^\d{4}-\d{2}-\d{2}$/;

export type ReportResource = (typeof REPORT_RESOURCE_TYPES)[number];

export type DateRangePreset = (typeof DATE_RANGE_PRESETS)[number] | 'CUSTOM' | 'ALL_TIME';

export type ReportSpec = {
  resource: ReportResource;
  fields?: string[];
  metrics?: string[];
  dateRange?: DateRangePreset;
  startDate?: string;
  endDate?: string;
  segmentByDate?: boolean;
  where?: string;
  orderBy?: string;
  limit?: number;
};
