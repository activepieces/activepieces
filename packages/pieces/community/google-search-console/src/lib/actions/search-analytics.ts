import { createAction, MarkdownVariant, Property } from '@activepieces/pieces-framework';
import { googleSearchConsoleAuth } from '../auth';
import { commonProps } from '../common';
import { gscInputs } from '../common/inputs';
import { gscOps } from '../common/operations';
import { gscOutputSchemas } from '../output-schemas';

export const searchAnalytics = createAction({
  auth: googleSearchConsoleAuth,
  name: 'search_analytics',
  classification: 'SEARCH',
  displayName: 'Search Analytics',
  description: 'Gets clicks, impressions, CTR and position for a site.',
  audience: 'human',
  aiMetadata: {
    description:
      'Queries clicks, impressions, CTR and position for a property picked from a list. Agents use Search Analytics (by Site URL). Read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    siteUrl: commonProps.siteUrl,
    info: Property.MarkDown({
      value: 'Search Console data lags 2–3 days and is kept for about 16 months.',
      variant: MarkdownVariant.INFO,
    }),
    startDate: Property.DateTime({
      displayName: 'Start Date',
      description: 'First day of the range, in Pacific Time.',
      placeholder: '2026-01-01',
      width: 'half',
      required: true,
    }),
    endDate: Property.DateTime({
      displayName: 'End Date',
      description: 'Last day of the range, inclusive.',
      placeholder: '2026-01-31',
      width: 'half',
      required: true,
    }),
    dimensions: Property.Array({
      displayName: 'Dimensions',
      description:
        'Group rows by query, page, country, device, searchAppearance, date or hour, in order. Empty: one totals row.',
      required: false,
    }),
    searchType: commonProps.searchType({ description: 'Default: Web. Discover and Google News have no search queries.' }),
    filters: commonProps.filters({ description: 'Only rows that match every filter are returned.', humanLabels: true }),
    rowLimit: Property.Number({
      displayName: 'Row Limit',
      description: 'Rows to return, from 1 to 25,000. Default: 1,000.',
      required: false,
    }),
    aggregationType: commonProps.aggregationType({
      description: 'Default: Auto. By Property cannot be used with page dimensions or filters.',
      advanced: true,
    }),
    dataState: commonProps.dataState({
      description: 'Default: Final. Hourly is needed for, and set by, the hour dimension.',
      advanced: true,
      humanLabels: true,
    }),
    startRow: Property.Number({
      displayName: 'Start Row',
      description: 'Rows to skip, to page through results. Default: 0.',
      required: false,
      advanced: true,
    }),
  },
  propertyGroups: [
    {
      key: 'period',
      display: 'section',
      label: 'Site and Dates',
      icon: 'calendar',
      props: ['siteUrl', 'info', 'startDate', 'endDate'],
    },
    {
      key: 'report',
      display: 'section',
      label: 'Report',
      icon: 'filter',
      props: ['dimensions', 'searchType', 'filters', 'rowLimit'],
    },
  ],
  outputSchema: gscOutputSchemas.searchAnalytics,
  async run(context) {
    const props = context.propsValue;
    const siteUrl = gscInputs.siteUrl({ value: props.siteUrl });
    const { startDate, endDate } = gscInputs.requiredDateRange({ startDate: props.startDate, endDate: props.endDate });
    const query = gscInputs.analyticsQuery({
      startDate,
      endDate,
      dimensions: gscInputs.dimensions({ value: props.dimensions }),
      searchType: props.searchType,
      filters: gscInputs.filters({ value: props.filters }),
      aggregationType: props.aggregationType,
      dataState: props.dataState,
      rowLimit: gscInputs.optionalInteger({ value: props.rowLimit, label: 'Row Limit', min: 1, max: gscInputs.HUMAN_MAX_ROW_LIMIT }),
      startRow: gscInputs.optionalInteger({ value: props.startRow, label: 'Start Row', min: 0, max: gscInputs.MAX_START_ROW }),
    });
    const result = await gscOps.searchAnalytics({ auth: context.auth, siteUrl, query });
    return { data: result.data, status: result.status, rows: result.rows, row_count: result.rows.length };
  },
});
