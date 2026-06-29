import { createAction } from '@activepieces/pieces-framework';
import { githubAuth } from '../../auth';
import { githubPaginatedApiCall } from '../../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { ownerProp, repoProp, githubError } from './common';

export const githubListBranchesAction = createAction({
  auth: githubAuth,
  name: 'list_branches',
  displayName: 'List Branches (Agent)',
  description: 'Lists the branches in a repository.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the branches in a repository (GET /repos/{owner}/{repo}/branches), each with its tip commit and protection flag. Use to resolve branch names for Create Branch, Create Pull Request, and file operations. Returns all pages. Read-only and idempotent.',
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
        resourceUri: `/repos/${owner}/${repo}/branches`,
      });
      return { items, count: items.length };
    } catch (error: any) {
      throw githubError(error, `Repository ${owner}/${repo}`);
    }
  },
});
