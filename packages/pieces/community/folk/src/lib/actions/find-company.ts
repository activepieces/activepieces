import { createAction, Property } from '@activepieces/pieces-framework';
import { folkAuth } from '../common/auth';
import { folkClient } from '../common/client';

export const findCompany = createAction({
  auth: folkAuth,
  name: 'findCompany',
  displayName: 'List Companies',
  description: 'Retrieve a paginated list of companies from your Folk workspace.',
  props: {
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
    const { limit, cursor, combinator, nameFilter } = context.propsValue;

    const res = await folkClient.getCompaniesWithFilters({
      apiKey: context.auth,
      limit: limit || 20,
      cursor,
      combinator: combinator as 'and' | 'or',
      nameFilter,
    });

    return {
      companies: res.data?.items ?? [],
      next_cursor: res.data?.pagination?.nextLink,
    };
  },
});
