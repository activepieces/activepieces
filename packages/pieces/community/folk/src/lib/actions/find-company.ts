import { createAction, Property } from '@activepieces/pieces-framework';
import { folkAuth } from '../common/auth';
import { folkClient } from '../common/client';

export const findCompany = createAction({
  auth: folkAuth,
  name: 'findCompany',
  displayName: 'Find Company',
  description: 'Search for companies in your Folk workspace by name or email address.',
  props: {
    query: Property.ShortText({
      displayName: 'Search Query',
      description: 'Enter company name or email to search for',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'The number of items to return (1-100)',
      required: false,
      defaultValue: 20,
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
    nameFilter: Property.ShortText({
      displayName: 'Name Filter',
      description: 'Filter by company name',
      required: false,
    }),
  },
  async run(context) {
    const { limit, cursor, combinator, nameFilter, query } = context.propsValue;

    const res = await folkClient.getCompaniesWithFilters({
      apiKey: context.auth,
      limit: limit || 20,
      cursor,
      combinator: combinator as 'and' | 'or',
      nameFilter: query || nameFilter,
    });

    return {
      companies: res.data?.items || [],
      count: res.data?.items?.length || 0,
      pagination: res.data?.pagination,
    };
  },
});
