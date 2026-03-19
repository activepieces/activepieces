import { createAction, Property } from '@activepieces/pieces-framework';
import { googleSearchConsoleAuth } from '../auth';
import { createAuthClient } from '../../';
import { commonProps } from '../common';
import dayjs from 'dayjs';


export const searchAnalytics = createAction({
  auth: googleSearchConsoleAuth,
  name: 'search_analytics',
  displayName: 'Search Analytics',
  description:
    'Query traffic data for your site using the Google Search Console API.',
  props: {
    siteUrl: commonProps.siteUrl,
    startDate: Property.DateTime({
      displayName: 'Start Date',
      description:
        'The start date of the date range to query (in YYYY-MM-DD format).',
      required: true,
      defaultValue: new Date().toISOString().split('T')[0],
    }),
    endDate: Property.DateTime({
      displayName: 'End Date',
      description:
        'The end date of the date range to query (in YYYY-MM-DD format).',
      required: true,
      defaultValue: new Date().toISOString().split('T')[0],
    }),
    dimensions: Property.Array({
      displayName: 'Dimensions',
      description:
        'The dimensions to group results by. Valid values: "query", "page", "country", "device", "searchAppearance", "date", "hour".',
      required: false,
    }),
    searchType: Property.StaticDropdown({
      displayName: 'Search Type',
      description:
        'Filter results by search type. Defaults to "web".',
      required: false,
      options: {
        options: [
          { label: 'Web', value: 'web' },
          { label: 'Discover', value: 'discover' },
          { label: 'Google News', value: 'googleNews' },
          { label: 'News', value: 'news' },
          { label: 'Image', value: 'image' },
          { label: 'Video', value: 'video' },
        ],
      },
    }),
    filters: Property.Array({
      displayName: 'Filters',
      description:
        'Optional filters to apply to the data. All filters are AND-ed together.',
      properties: {
        dimension: Property.StaticDropdown({
          displayName: 'Dimension',
          description: 'The dimension to filter by.',
          required: true,
          options: {
            options: [
              { label: 'Query', value: 'query' },
              { label: 'Page', value: 'page' },
              { label: 'Country (ISO 3166-1 alpha-3, e.g. "ind")', value: 'country' },
              { label: 'Device', value: 'device' },
              { label: 'Search Appearance', value: 'searchAppearance' },
            ],
          },
        }),
        operator: Property.StaticDropdown({
          displayName: 'Operator',
          description: 'The filter operator to apply.',
          required: true,
          options: {
            options: [
              { label: 'Equals', value: 'equals' },
              { label: 'Not Equals', value: 'notEquals' },
              { label: 'Contains', value: 'contains' },
              { label: 'Not Contains', value: 'notContains' },
              { label: 'Including Regex', value: 'includingRegex' },
              { label: 'Excluding Regex', value: 'excludingRegex' },
            ],
          },
        }),
        expression: Property.ShortText({
          displayName: 'Expression',
          description:
            'The value to compare against. For "country" use ISO 3166-1 alpha-3 (e.g. "ind"). For "device" use DESKTOP, MOBILE, or TABLET.',
          required: true,
        }),
      },
      required: false,
    }),
    aggregationType: Property.StaticDropdown({
      displayName: 'Aggregation Type',
      description: 'How data is aggregated. Defaults to "auto".',
      required: false,
      options: {
        options: [
          { label: 'Auto', value: 'auto' },
          { label: 'By Page', value: 'byPage' },
          { label: 'By Property', value: 'byProperty' },
          { label: 'By News Showcase Panel', value: 'byNewsShowcasePanel' },
        ],
      },
    }),
    rowLimit: Property.Number({
      displayName: 'Row Limit',
      description: 'The maximum number of rows to return. Min: 1, Max: 5,000. Defaults to 1,000.',
      required: false,
    }),
    startRow: Property.Number({
      displayName: 'Start Row',
      description:
        'Zero-based index of the first row to return. Use with Row Limit to paginate results. Defaults to 0.',
      required: false,
    }),
  },
  async run(context) {
    const webmasters = createAuthClient(context.auth.access_token);
    const filters = context.propsValue.filters as any;
    const res = await webmasters.searchanalytics.query({
      siteUrl: context.propsValue.siteUrl,
      requestBody: {
        startDate: dayjs(context.propsValue.startDate).format('YYYY-MM-DD'),
        endDate: dayjs(context.propsValue.endDate).format('YYYY-MM-DD'),
        dimensions: context.propsValue.dimensions as string[],
        searchType: context.propsValue.searchType,
        dimensionFilterGroups: filters?.length
          ? [{
              filters: filters.map((filter: any) => ({
                dimension: filter.dimension,
                operator: filter.operator,
                expression: filter.expression,
              })),
            }]
          : undefined,
        aggregationType: context.propsValue.aggregationType,
        rowLimit: context.propsValue.rowLimit,
        startRow: context.propsValue.startRow,
      },
    });
    return res;
  },
});
