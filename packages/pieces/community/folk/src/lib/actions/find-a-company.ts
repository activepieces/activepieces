import { createAction, Property } from '@activepieces/pieces-framework';
import { folkAuth } from '../common/auth';
import { folkApiCall } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const findCompanies = createAction({
  auth: folkAuth,
  name: 'find-a-company',
  displayName: 'Find a Company',
  description: 'Retrieve a list of companies in the workspace',
  props: {
    limit: Property.Number({
      displayName: 'Limit',
      description: 'The number of items to return (1-100)',
      required: false,
      defaultValue: 20,
    }),
    cursor: Property.ShortText({
      displayName: 'Cursor',
      description: 'A cursor for pagination. Use the pagination.nextLink value from a previous response.',
      required: false,
    }),
    combinator: Property.StaticDropdown({
      displayName: 'Combinator',
      description: 'The logical operator to combine multiple filters',
      required: false,
      defaultValue: 'and',
      options: {
        options: [
          { label: 'AND', value: 'and' },
          { label: 'OR', value: 'or' },
        ],
      },
    }),
    filter: Property.Object({
      displayName: 'Filter',
      description: 'A record of filters to apply, following the format filter[attribute][operator]=value',
      required: false,
    }),
  },
  async run(context) {
    const { limit, cursor, combinator, filter } = context.propsValue;

    // Build query parameters
    const queryParams: Record<string, string> = {};

    if (limit !== undefined && limit !== null) {
      queryParams['limit'] = limit.toString();
    }
    
    if (cursor) {
      queryParams['cursor'] = cursor;
    }
    
    if (combinator) {
      queryParams['combinator'] = combinator;
    }

    // Handle filter object - convert to query parameters
    if (filter && typeof filter === 'object') {
      Object.entries(filter).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams[key] = String(value);
        }
      });
    }

    // Build query string
    const queryString = Object.keys(queryParams).length > 0
      ? '?' + Object.entries(queryParams)
          .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
          .join('&')
      : '';

    // Make the API call
    const response = await folkApiCall({
      apiKey: context.auth,
      method: HttpMethod.GET,
      endpoint: `/companies${queryString}`,
    });

    return response;
  },
});
