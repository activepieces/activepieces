import { createAction, Property } from '@activepieces/pieces-framework';
import { folkAuth } from '../common/auth';
import { folkClient } from '../common/client';

export const findCompany = createAction({
  auth: folkAuth,
  name: 'findCompany',
  displayName: 'Find Company',
  description: 'Search for companies in your Folk workspace by name.',
  props: {
    query: Property.ShortText({
      displayName: 'Search Query',
      description: 'Enter company name to search for',
      required: true,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'The number of items to return (1-100)',
      required: false,
      defaultValue: 100,
    }),
    cursor: Property.ShortText({
      displayName: 'Cursor',
      description: 'A cursor for pagination.',
      required: false,
    }),
    combinator: Property.StaticDropdown({
      displayName: 'Filter Combinator',
      description: 'Logical operator for multiple filters',
      required: false,
      defaultValue: 'and',
      options: {
        options: [
          { label: 'AND', value: 'and' },
          { label: 'OR', value: 'or' },
        ],
      },
    }),
  },
  async run(context) {
    const { limit, cursor, combinator, query } = context.propsValue;

    const res = await folkClient.getCompaniesWithFilters({
      apiKey: context.auth,
      limit: limit || 100,
      cursor,
      combinator: (combinator === 'or' ? 'or' : 'and'),
      nameFilter: query,
    });

    return {
      companies: res.data?.items ?? [],
      count: res.data?.items?.length ?? 0,
      next_cursor: res.data?.pagination?.nextLink,
      pagination: res.data?.pagination,
    };
  },
});
