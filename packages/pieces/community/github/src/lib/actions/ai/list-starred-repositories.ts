import { createAction } from '@activepieces/pieces-framework';
import { githubAuth } from '../../auth';
import { githubPaginatedApiCall } from '../../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { githubError } from './common';

export const githubListStarredRepositoriesAction = createAction({
  auth: githubAuth,
  name: 'list_starred_repositories',
  displayName: 'List Starred Repositories (Agent)',
  description: 'Lists the repositories the connected user has starred.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the repositories the connected user has starred (GET /user/starred). User-context — under GitHub App auth there is no user, so it is empty/unavailable. Returns all pages. Read-only and idempotent.',
    idempotent: true,
  },
  props: {},
  async run({ auth }) {
    try {
      const items = await githubPaginatedApiCall<Record<string, unknown>>({
        auth,
        method: HttpMethod.GET,
        resourceUri: `/user/starred`,
      });
      return { items, count: items.length };
    } catch (error: any) {
      throw githubError(error, 'The authenticated user');
    }
  },
});
