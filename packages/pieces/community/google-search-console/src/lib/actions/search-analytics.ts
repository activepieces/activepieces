import { createAction, Property } from '@activepieces/pieces-framework';
import { googleSearchConsoleAuth, createAuthClient } from '../../';
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
        'The dimensions to group results by. For example: ["query", "page", "country", "device", "searchAppearance", "date"].',
      required: false,
    }),
    filters: Property.Array({
      displayName: 'Filters',
      description:
        'Optional filters to apply to the data. Filters can be used to restrict the results to a specific subset.',
      properties: {
        dimension: Property.ShortText({
          displayName: 'Dimension',
          description:
            'The dimension to filter by (e.g., query, page, country, device).',
          required: true,
        }),
        operator: Property.ShortText({
          displayName: 'Operator',
          description: 'The filter operator to apply (e.g., equals, contains).',
          required: true,
        }),
        expression: Property.ShortText({
          displayName: 'Expression',
          description: 'The expression to compare the dimension against.',
          required: true,
        }),
      },
      required: false,
    }),
    aggregationType: Property.ShortText({
      displayName: 'Aggregation Type',
      description:
        'How data is aggregated. Options include "auto", "byPage", "byProperty".',
      required: false,
    }),
    rowLimit: Property.Number({
      displayName: 'Row Limit',
      description: 'The maximum number of rows to return.',
      required: false,
    }),
    startRow: Property.Number({
      displayName: 'Start Row',
      description:
        'The first row to return. Use this parameter to paginate results.',
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
        dimensionFilterGroups: filters.map((filter: any) => ({
          dimension: filter.dimension,
          operator: filter.operator,
          expression: filter.expression,
        })),
        aggregationType: context.propsValue.aggregationType,
        rowLimit: context.propsValue.rowLimit,
        startRow: context.propsValue.startRow,
      },
    });
    return res;
  },
});
