import { createAction, Property } from '@activepieces/pieces-framework';
import { folkAuth } from '../common/auth';
import { folkClient } from '../common/client';

export const findPerson = createAction({
  auth: folkAuth,
  name: 'findPerson',
  displayName: 'List People',
  description: 'Retrieve a paginated list of people in your Folk workspace with optional filtering.',
  audience: 'both',
  aiMetadata: {
    description: 'Lists people (contacts) in the Folk CRM, returning a single cursor-paginated page. With no filters it returns all people; optional name and email filters (contains-match) combined by AND or OR narrow the results. Use to browse contacts or resolve a name/email into a person ID; pass the cursor to page through additional results. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    limit: Property.Number({
      displayName: 'Limit',
      description: 'The number of items to return (1-100)',
      required: false,
      defaultValue: 20,
    }),
    cursor: Property.ShortText({
      displayName: 'Cursor',
      description: 'A cursor for pagination. Use the nextLink value from a previous response.',
      required: false,
    }),
    combinator: Property.StaticDropdown({
      displayName: 'Filter Combinator',
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
    nameFilter: Property.ShortText({
      displayName: 'Name Filter',
      description: 'Filter by person name (contains)',
      required: false,
    }),
    emailFilter: Property.ShortText({
      displayName: 'Email Filter',
      description: 'Filter by email address (contains)',
      required: false,
    }),
  },
  async run(context) {
    const { limit, cursor, combinator, nameFilter, emailFilter } = context.propsValue;

    const response = await folkClient.getPeopleWithFilters({
      apiKey: context.auth,
      limit: limit || 20,
      cursor,
      combinator: combinator as 'and' | 'or',
      nameFilter,
      emailFilter,
    });

    return {
      data: response.data,
      success: true,
    };
  },
});

