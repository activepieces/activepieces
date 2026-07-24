import { createAction, Property } from '@activepieces/pieces-framework';
import { githubAuth } from '../../auth';
import { githubApiCall } from '../../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const githubDeleteBranchAiAction = createAction({
  auth: githubAuth,
  name: 'delete_branch_ai',
  displayName: 'Delete Branch (Agent)',
  description: 'Deletes a branch from a repository.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Permanently deletes a branch ref (DELETE /repos/{owner}/{repo}/git/refs/heads/{branch}). Use to clean up a merged or stale branch. Resolve branch names via List Branches. Not idempotent: a repeat call on an already-deleted branch returns a not-found error.',
    idempotent: false,
  },
  props: {
    owner: Property.ShortText({
      displayName: 'Owner',
      description:
        'Repository owner login (user or org). Resolve via List My Repositories or Search Repositories.',
      required: true,
    }),
    repo: Property.ShortText({
      displayName: 'Repository',
      description: 'Repository name (without the owner prefix).',
      required: true,
    }),
    branch: Property.ShortText({
      displayName: 'Branch',
      description:
        'The name of the branch to delete (e.g. "feature/old"). Resolve via List Branches.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { owner, repo, branch } = propsValue;
    try {
      const response = await githubApiCall({
        auth,
        method: HttpMethod.DELETE,
        resourceUri: `/repos/${owner}/${repo}/git/refs/heads/${branch}`,
      });
      return { success: true, status: response.status, deleted: branch };
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 404 || status === 422)
        throw new Error(
          `Branch "${branch}" not found in ${owner}/${repo} (it may already be deleted).`
        );
      if (status === 403)
        throw new Error('Permission denied deleting the branch.');
      throw error;
    }
  },
});
