import { createAction, Property } from '@activepieces/pieces-framework';
import { googleSearchConsoleAuth } from '../../auth';
import { commonProps } from '../../common';
import { gscInputs } from '../../common/inputs';
import { gscOps } from '../../common/operations';
import { gscOutputSchemas } from '../../output-schemas';

const AI_DEFAULT_ROW_LIMIT = 100;
const AI_MAX_ROW_LIMIT = 1000;

export const searchAnalyticsBySiteUrl = createAction({
  auth: googleSearchConsoleAuth,
  name: 'search_analytics_by_site_url',
  classification: 'SEARCH',
  displayName: 'Search Analytics (by Site URL)',
  description: 'Queries search traffic (clicks, impressions, CTR, position) for a property.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns Google Search clicks, impressions, CTR (0-1) and average position for a property, grouped by up to seven dimensions (date, hour, query, page, country, device, searchAppearance). Dates are Pacific Time, data lags 2-3 days and is kept about 16 months; rows without impressions are usually left out (position is null when a row has no impressions). Prefer last_n_days for "last week/month"; page with next_start_row while has_more is true. Read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    site_url: commonProps.aiSiteUrl(),
    last_n_days: Property.Number({
      displayName: 'Last N Days',
      description: 'Number of days ending yesterday (Pacific Time), from 1 to 500. Used when Start Date is empty; defaults to 28. Do not combine with Start Date/End Date.',
      required: false,
    }),
    start_date: Property.ShortText({
      displayName: 'Start Date',
      description: 'First day of the range, YYYY-MM-DD (Pacific Time). Leave empty to use Last N Days.',
      required: false,
    }),
    end_date: Property.ShortText({
      displayName: 'End Date',
      description: 'Last day of the range (inclusive), YYYY-MM-DD (Pacific Time). Defaults to yesterday when Start Date is set.',
      required: false,
    }),
    dimensions: commonProps.dimensionsMulti(),
    search_type: commonProps.searchType(),
    filters: commonProps.filters(),
    aggregation_type: commonProps.aggregationType(),
    data_state: commonProps.dataState(),
    row_limit: Property.Number({
      displayName: 'Row Limit',
      description: `Maximum rows to return, from 1 to ${AI_MAX_ROW_LIMIT}. Defaults to ${AI_DEFAULT_ROW_LIMIT}.`,
      required: false,
    }),
    start_row: Property.Number({
      displayName: 'Start Row',
      description: 'Zero-based index of the first row; pass next_start_row from the previous call to get the next page. Defaults to 0.',
      required: false,
    }),
  },
  outputSchema: gscOutputSchemas.searchAnalyticsAi,
  async run(context) {
    const props = context.propsValue;
    const siteUrl = gscInputs.siteUrl({ value: props.site_url });
    const { startDate, endDate } = gscInputs.dateRange({ startDate: props.start_date, endDate: props.end_date, lastNDays: props.last_n_days });
    const rowLimit = gscInputs.optionalInteger({ value: props.row_limit, label: 'Row Limit', min: 1, max: AI_MAX_ROW_LIMIT }) ?? AI_DEFAULT_ROW_LIMIT;
    const startRow = gscInputs.optionalInteger({ value: props.start_row, label: 'Start Row', min: 0, max: gscInputs.MAX_START_ROW }) ?? 0;
    const query = gscInputs.analyticsQuery({
      startDate,
      endDate,
      dimensions: gscInputs.dimensions({ value: props.dimensions }),
      searchType: props.search_type,
      filters: gscInputs.filters({ value: props.filters }),
      aggregationType: props.aggregation_type,
      dataState: props.data_state,
      rowLimit,
      startRow,
    });
    const result = await gscOps.searchAnalytics({ auth: context.auth, siteUrl, query });
    const metadata = result.data['metadata'];
    const hasMore = result.rows.length === rowLimit;
    return {
      rows: result.rows,
      row_count: result.rows.length,
      has_more: hasMore,
      next_start_row: hasMore ? startRow + result.rows.length : null,
      start_date: startDate,
      end_date: endDate,
      data_state: query.dataState ?? 'final',
      aggregation_type: typeof result.data['responseAggregationType'] === 'string' ? result.data['responseAggregationType'] : null,
      first_incomplete_date: readMetadata({ metadata, key: 'firstIncompleteDate' }),
      first_incomplete_hour: readMetadata({ metadata, key: 'firstIncompleteHour' }),
    };
  },
});

function readMetadata({ metadata, key }: { metadata: unknown; key: string }): string | null {
  if (metadata === null || typeof metadata !== 'object') {
    return null;
  }
  const value: unknown = Reflect.get(metadata, key);
  return typeof value === 'string' ? value : null;
}
