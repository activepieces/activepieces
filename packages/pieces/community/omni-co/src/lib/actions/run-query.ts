import { createAction, Property } from '@activepieces/pieces-framework';
import { omniAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const runQuery = createAction({
  auth: omniAuth,
  name: 'runQuery',
  displayName: 'Run query',
  description:
    'Runs a query and returns the results as base64 encoded Apache Arrow table or in specified format',
  props: {
    query: Property.Json({
      displayName: 'Query',
      description:
        "A JSON object representing the query to be run. You can retrieve a query's JSON object from an Omni workbook by opening the Inspector panel (Option + 9 on Mac, Alt + 9 on Windows) and copying the Query structure",
      required: true,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description:
        'Number of rows to be returned (defaults to 1000). Set to null for unlimited results',
      required: false,
    }),
    cache: Property.StaticDropdown({
      displayName: 'Cache Policy',
      description: 'Optional cache policy to control how query caching behaves',
      options: {
        disabled: false,
        options: [
          { label: 'Standard', value: 'Standard' },
          { label: 'Skip Requery (default)', value: 'SkipRequery' },
          { label: 'Skip Cache', value: 'SkipCache' },
        ],
      },
      required: false,
    }),
    formatResults: Property.Checkbox({
      displayName: 'Format Results',
      description:
        'Apply formatting to numeric and currency values (currency symbols and thousand separators)',
      required: false,
      defaultValue: true,
    }),
    resultType: Property.StaticDropdown({
      displayName: 'Result Type',
      description:
        'Specifies the format of query results. If omitted, returns base64 encoded Apache Arrow format',
      options: {
        disabled: false,
        options: [
          { label: 'CSV', value: 'csv' },
          { label: 'JSON', value: 'json' },
          { label: 'XLSX', value: 'xlsx' },
        ],
      },
      required: false,
    }),
    planOnly: Property.Checkbox({
      displayName: 'Plan Only',
      description:
        'If enabled, returns the query execution plan without running the query',
      required: false,
      defaultValue: false,
    }),
    userId: Property.ShortText({
      displayName: 'User ID',
      description: 'Optional UUID to run the query as a specific user',
      required: false,
    }),
  },
  async run(context) {
    const { query, limit, cache, formatResults, resultType, planOnly, userId } =
      context.propsValue;

    const body: Record<string, unknown> = {
      query,
    };

    if (limit !== undefined && limit !== null) {
      body['limit'] = limit;
    }

    if (cache) {
      body['cache'] = cache;
    }

    if (formatResults !== undefined) {
      body['formatResults'] = formatResults;
    }

    if (resultType) {
      body['resultType'] = resultType;
    }

    if (planOnly) {
      body['planOnly'] = planOnly;
    }

    if (userId) {
      body['userId'] = userId;
    }

    const response = await makeRequest(
      context.auth.secret_text,
      HttpMethod.POST,
      '/query/run',
      body
    );

    return response;
  },
});
