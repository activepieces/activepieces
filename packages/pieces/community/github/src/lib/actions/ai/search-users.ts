import { createAction, Property } from '@activepieces/pieces-framework';
import { githubAuth } from '../../auth';
import { githubApiCall, RequestParams } from '../../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { githubError } from './common';

export const githubSearchUsersAction = createAction({
  auth: githubAuth,
  name: 'search_users',
  displayName: 'Search Users (Agent)',
  description: 'Searches GitHub users and organizations.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Searches users and organizations (GET /search/users?q=) using qualifiers like "type:user", "type:org", "location:", "language:". Use to resolve a login from a name. Returns a search result (total_count + items) capped at 1000. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    q: Property.ShortText({
      displayName: 'Query',
      description: 'User search query, e.g. "tom repos:>10 location:london".',
      required: true,
    }),
    per_page: Property.Number({
      displayName: 'Per Page',
      description: 'Results per page (max 100).',
      required: false,
    }),
    page: Property.Number({
      displayName: 'Page',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const query: RequestParams = { q: propsValue.q };
    if (propsValue.per_page) query['per_page'] = propsValue.per_page;
    if (propsValue.page) query['page'] = propsValue.page;
    try {
      const response = await githubApiCall({
        auth,
        method: HttpMethod.GET,
        resourceUri: `/search/users`,
        query,
      });
      return response.body;
    } catch (error: any) {
      throw githubError(error, 'User search');
    }
  },
});
