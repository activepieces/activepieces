import { createAction, Property } from '@activepieces/pieces-framework';
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
  description: 'Query traffic data for your site using the Google Search Console API.',
  audience: 'human',
  aiMetadata: {
    description:
      'Queries clicks, impressions, CTR and position for a property picked from a list. Agents use Search Analytics (by Site URL). Read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    siteUrl: commonProps.siteUrl,
    startDate: Property.DateTime({
      displayName: 'Start Date',
      description: 'First day of the range (YYYY-MM-DD), in Pacific Time. Search Console data lags 2-3 days and is kept for about 16 months.',
      required: true,
    }),
    endDate: Property.DateTime({
      displayName: 'End Date',
      description: 'Last day of the range (YYYY-MM-DD, inclusive), in Pacific Time. A range that covers only today or yesterday usually has no data yet.',
      required: true,
    }),
    dimensions: Property.Array({
      displayName: 'Dimensions',
      description:
        'The dimensions to group results by, in order. Valid values: "query", "page", "country", "device", "searchAppearance", "date", "hour". Each row of the output gets one column per dimension.',
      required: false,
    }),
    searchType: commonProps.searchType(),
    filters: commonProps.filters(),
    aggregationType: commonProps.aggregationType(),
    dataState: commonProps.dataState(),
    rowLimit: Property.Number({
      displayName: 'Row Limit',
      description: 'The maximum number of rows to return, from 1 to 25,000. Defaults to 1,000.',
      required: false,
    }),
    startRow: Property.Number({
      displayName: 'Start Row',
      description: 'Zero-based index of the first row to return. Use with Row Limit to page through results. Defaults to 0.',
      required: false,
    }),
  },
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
