import { createAction } from '@activepieces/pieces-framework';
import { githubAuth } from '../../auth';
import { githubPaginatedApiCall } from '../../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { ownerProp, repoProp, githubError } from './common';

export const githubListAssigneesAction = createAction({
  auth: githubAuth,
  name: 'list_assignees',
  displayName: 'List Assignees (Agent)',
  description: 'Lists users who can be assigned to issues in a repository.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the users assignable to issues and pull requests in a repository (GET /repos/{owner}/{repo}/assignees). Use to resolve valid logins for Add Assignees to Issue. Returns all pages. Read-only and idempotent.',
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
        resourceUri: `/repos/${owner}/${repo}/assignees`,
      });
      return { items, count: items.length };
    } catch (error: any) {
      throw githubError(error, `Repository ${owner}/${repo}`);
    }
  },
});
