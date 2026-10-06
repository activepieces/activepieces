import { createAction, Property } from '@activepieces/pieces-framework';

import { googleAdsAuth } from '../auth';
import { GoogleAdsApi } from '../common/client';
import { customerIdProp } from '../common/props';
import { DATE_RANGE_PRESETS, DEFAULT_METRICS, REPORT_RESOURCES, REPORT_RESOURCE_TYPES, buildReportQuery, flattenRow } from '../common/reports';
import type { DateRangePreset, ReportResource } from '../common/reports';
import { retrieveReportOutputSchema } from '../output-schemas';

function resourceOptions(): { label: string; value: ReportResource }[] {
  return REPORT_RESOURCE_TYPES.map((value) => ({
    label: REPORT_RESOURCES[value].label,
    value,
  }));
}

function dateRangeOptions(): { label: string; value: DateRangePreset }[] {
  return [
    ...DATE_RANGE_PRESETS.map((value) => ({ label: value.replace(/_/g, ' ').toLowerCase(), value })),
    { label: 'custom (start / end date)', value: 'CUSTOM' },
    { label: 'all time (no date filter)', value: 'ALL_TIME' },
  ];
}

const DEFAULT_MAX_ROWS = 1000;
const HARD_MAX_ROWS = 100_000;

export const retrieveReport = createAction({
  name: 'retrieveReport',
  classification: 'SEARCH',
  displayName: 'Retrieve Advertising Report',
  description: 'Performance metrics per campaign, ad group, ad, keyword, search term or account, over a date range',
  audience: 'both',
  aiMetadata: {
    description:
      'Get performance metrics (impressions, clicks, cost, conversions and more) for one Google Ads account, broken down by account, campaign, ad group, ad, keyword or search term over a date range, as flat rows keyed by GAQL field name. Use for reporting; to list records without metrics use Search records. Cost values are in micros; read-only and safe to retry.',
    idempotent: true,
  },
  auth: googleAdsAuth,
  props: {
    customerId: customerIdProp,
    resource: Property.StaticDropdown<ReportResource, true>({
      displayName: 'Report On',
      description: 'The level the metrics are broken down by.',
      required: true,
      defaultValue: 'campaign',
      options: { options: resourceOptions() },
    }),
    dateRange: Property.StaticDropdown<DateRangePreset, true>({
      displayName: 'Date Range',
      required: true,
      defaultValue: 'LAST_30_DAYS',
      options: { options: dateRangeOptions() },
    }),
    startDate: Property.ShortText({ displayName: 'Start Date', description: 'YYYY-MM-DD, with the custom date range.', required: false }),
    endDate: Property.ShortText({ displayName: 'End Date', description: 'YYYY-MM-DD, with the custom date range.', required: false }),
    segmentByDate: Property.Checkbox({
      displayName: 'One Row per Day',
      description: 'Adds `segments.date`, so each entity returns one row per day instead of a total.',
      required: false,
      defaultValue: false,
    }),
    metrics: Property.Array({
      displayName: 'Metrics',
      description: `GAQL metric fields. Default: ${DEFAULT_METRICS.join(', ')}.`,
      required: false,
    }),
    fields: Property.Array({
      displayName: 'Entity Fields',
      description: 'GAQL attribute fields to return next to the metrics (default: the id, name and status of the chosen level).',
      required: false,
    }),
    where: Property.ShortText({
      displayName: 'Filter',
      description: "Extra GAQL condition, e.g. `campaign.status = 'ENABLED'` or `metrics.clicks > 0`.",
      required: false,
    }),
    orderBy: Property.ShortText({ displayName: 'Order By', description: 'e.g. `metrics.clicks DESC`. The field must be selected.', required: false }),
    maxRows: Property.Number({
      displayName: 'Max Rows',
      description: `Stops after this many rows (default ${DEFAULT_MAX_ROWS}, at most ${HARD_MAX_ROWS}).`,
      required: false,
      defaultValue: DEFAULT_MAX_ROWS,
    }),
    query: Property.LongText({
      displayName: 'Advanced: Full GAQL Query',
      description: 'When filled, runs this query as-is and ignores every field above except Customer and Max Rows.',
      required: false,
    }),
  },
  outputSchema: retrieveReportOutputSchema,
  async run(context) {
    const { customerId, resource, dateRange, startDate, endDate, segmentByDate, metrics, fields, where, orderBy, maxRows, query } =
      context.propsValue;

    const gaql =
      query?.trim() ||
      buildReportQuery({
        resource,
        dateRange,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        segmentByDate: Boolean(segmentByDate),
        metrics: (metrics ?? []).map(String),
        fields: (fields ?? []).map(String),
        where: where || undefined,
        orderBy: orderBy || undefined,
      });

    const cap = Math.min(Math.max(Number(maxRows) || DEFAULT_MAX_ROWS, 1), HARD_MAX_ROWS);
    const { results, truncated } = await GoogleAdsApi.searchAll({ auth: context.auth, customerId, query: gaql, maxRows: cap });
    const rows = results.map((row) => flattenRow(row));

    return { query: gaql, rows, count: rows.length, truncated };
  },
});
