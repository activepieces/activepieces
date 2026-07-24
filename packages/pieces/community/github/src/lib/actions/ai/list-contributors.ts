import { createAction } from '@activepieces/pieces-framework';
import { githubAuth } from '../../auth';
import { githubPaginatedApiCall } from '../../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { ownerProp, repoProp, githubError } from './common';

export const githubListContributorsAction = createAction({
  auth: githubAuth,
  name: 'list_contributors',
  displayName: 'List Contributors (Agent)',
  description: 'Lists the contributors to a repository.',
  audience: 'ai',
  aiMetadata: {
    description:
      "Lists the contributors to a repository (GET /repos/{owner}/{repo}/contributors) with each contributor's commit count. Returns all pages. Read-only and idempotent.",
    idempotent: true,
  },
  props: {
    owner: ownerProp,
    repo: repoProp,
  },
  async run({ auth, propsValue }) {
    const { owner, repo } = propsValue;
    try {
      const items = await githubPaginatedApiCall<Record<string, unknown>>({
        auth,
        method: HttpMethod.GET,
        resourceUri: `/repos/${owner}/${repo}/contributors`,
      });
      return { items, count: items.length };
    } catch (error: any) {
      throw githubError(error, `Repository ${owner}/${repo}`);
    }
  },
});
