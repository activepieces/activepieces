import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { nutshellAuth } from '../common/auth';
import { nutshellApiCall } from '../common/client';
import { buildSortOptions, LEAD_SORT_FIELDS } from '../common/constants';

export const searchLeads = createAction({
  auth: nutshellAuth,
  name: 'searchLeads',
  displayName: 'Search Leads',
  description: 'Searches for leads matching a query.',
  audience: 'both',
  aiMetadata: {
    description:
      'Searches Nutshell leads by a free-text query across name, description, and related info, with optional sorting and pagination. Use to find leads before reading or updating them. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    query: Property.ShortText({
      displayName: 'Search Query',
      description: 'Matches leads with similar info (name, description, etc.). Leave blank to list all leads.',
      required: false,
    }),
    sort: Property.StaticDropdown({
      displayName: 'Sort By',
      required: false,
      options: {
        options: buildSortOptions(LEAD_SORT_FIELDS),
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
    const { query, sort, page, limit } = context.propsValue;
    return nutshellApiCall({
      auth: context.auth,
      method: HttpMethod.GET,
      resourceUri: '/leads',
      query: {
        q: query,
        sort,
        'page[page]': page,
        'page[limit]': limit,
      },
    });
  },
});
