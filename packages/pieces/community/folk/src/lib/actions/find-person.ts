import { createAction, Property } from '@activepieces/pieces-framework';
import { folkAuth } from '../common/auth';
import { folkClient } from '../common/client';
import { folkFields } from '../common/fields';
import { folkOutputSchemas } from '../output-schemas';

export const findPerson = createAction({
  auth: folkAuth,
  name: 'findPerson',
  classification: 'SEARCH',
  displayName: 'List People',
  description: 'Retrieve a page of people in your Folk workspace, optionally filtered by name or email.',
  audience: 'human',
  outputSchema: folkOutputSchemas.legacyListPeople,
  aiMetadata: {
    description:
      'Lists one cursor-paginated page of Folk people, optionally filtered by name and email (contains-match) combined with AND or OR. Pass Next Cursor to get the following page. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    limit: Property.Number({
      displayName: 'Limit',
      description: 'The number of people to return (1-100).',
      required: false,
      defaultValue: 20,
    }),
    cursor: Property.ShortText({
      displayName: 'Cursor',
      description: 'Next Cursor from the previous result. Empty for the first page.',
      required: false,
    }),
    combinator: Property.StaticDropdown({
      displayName: 'Filter Combinator',
      description: 'How to combine the name and email filters when both are set.',
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
    const name = folkFields.textValue({ value: context.propsValue.nameFilter });
    const email = folkFields.textValue({ value: context.propsValue.emailFilter });
    const query: Record<string, string> = {
      ...(name ? { 'filter[fullName][like]': name } : {}),
      ...(email ? { 'filter[emails][like]': email } : {}),
      ...(name && email ? { combinator: context.propsValue.combinator === 'or' ? 'or' : 'and' } : {}),
    };
    const page = await folkClient.listPage<Record<string, unknown>>({
      auth: context.auth,
      path: '/v1/people',
      query,
      limit: folkFields.limitValue({ value: context.propsValue.limit }),
      cursor: folkFields.cursorValue({ value: context.propsValue.cursor }),
    });
    return {
      data: { items: page.items, pagination: page.nextLink ? { nextLink: page.nextLink } : {} },
      hasMore: page.hasMore,
      nextCursor: page.nextCursor,
      success: true,
    };
  },
});
