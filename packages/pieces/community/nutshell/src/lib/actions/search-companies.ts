import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { nutshellAuth } from '../common/auth';
import { nutshellApiCall } from '../common/client';
import { ACCOUNT_SORT_FIELDS, buildSortOptions } from '../common/constants';

export const searchCompanies = createAction({
  auth: nutshellAuth,
  name: 'searchCompanies',
  displayName: 'Search Companies',
  description: 'Searches for companies (accounts) matching a query.',
  audience: 'both',
  aiMetadata: {
    description:
      'Searches Nutshell companies by a free-text query across name and related info, or by a linked email address, with optional sorting and pagination. Use to find a company before reading or updating it. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    query: Property.ShortText({
      displayName: 'Search Query',
      description: 'Matches companies with similar info (name, etc.). Leave blank to list all companies.',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Return only companies linked to this exact email address.',
      required: false,
    }),
    sort: Property.StaticDropdown({
      displayName: 'Sort By',
      required: false,
      options: {
        options: buildSortOptions(ACCOUNT_SORT_FIELDS),
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
      resourceUri: '/accounts',
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
