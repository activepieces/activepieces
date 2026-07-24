import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { nutshellAuth } from '../common/auth';
import { nutshellApiCall } from '../common/client';
import { buildSortOptions, CONTACT_SORT_FIELDS } from '../common/constants';

export const searchContacts = createAction({
  auth: nutshellAuth,
  name: 'searchContacts',
  displayName: 'Search Contacts',
  description: 'Searches for contacts matching a query.',
  audience: 'both',
  aiMetadata: {
    description:
      'Searches Nutshell contacts by a free-text query across name, email, and location, or by exact email address, with optional sorting and pagination. Use to find a contact before reading or updating it. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    query: Property.ShortText({
      displayName: 'Search Query',
      description: 'Matches contacts with similar info (name, email, location, etc.). Leave blank to list all contacts.',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Return only contacts with this exact email address.',
      required: false,
    }),
    sort: Property.StaticDropdown({
      displayName: 'Sort By',
      required: false,
      options: {
        options: buildSortOptions(CONTACT_SORT_FIELDS),
      },
    }),
    page: Property.Number({
      displayName: 'Page',
      description: '0-based page index.',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Results Per Page',
      required: false,
    }),
  },
  async run(context) {
    const { query, email, sort, page, limit } = context.propsValue;
    return nutshellApiCall({
      auth: context.auth,
      method: HttpMethod.GET,
      resourceUri: '/contacts',
      query: {
        q: query,
        email,
        sort,
        'page[page]': page,
        'page[limit]': limit,
      },
    });
  },
});
