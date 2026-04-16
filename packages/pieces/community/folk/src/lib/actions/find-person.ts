import { createAction, Property } from '@activepieces/pieces-framework';
import { folkAuth } from '../common/auth';
import { folkClient } from '../common/client';

export const findPerson = createAction({
  auth: folkAuth,
  name: 'findPerson',
  displayName: 'List People',
  description: 'Retrieve a paginated list of people from your Folk workspace.',
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
      description: 'Filter by name (partial match)',
      required: false,
    }),
    emailFilter: Property.ShortText({
      displayName: 'Email Filter',
      description: 'Filter by email (partial match)',
      required: false,
    }),
  },
  async run(context) {
    const { limit, cursor, combinator, nameFilter, emailFilter } = context.propsValue;

    const res = await folkClient.getPeopleWithFilters({
      apiKey: context.auth,
      limit: limit || 20,
      cursor,
      combinator: combinator as 'and' | 'or',
      nameFilter,
      emailFilter,
    });

    return {
      people: res.data?.items ?? [],
      next_cursor: res.data?.pagination?.nextLink,
    };
  },
});
