import { createAction } from '@activepieces/pieces-framework';
import { githubAuth } from '../auth';
import { githubApiCall, githubCommon } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const githubDeleteBranchAction = createAction({
  auth: githubAuth,
  name: 'delete_branch',
  displayName: 'Delete Branch',
  description: 'Deletes a branch from a repository.',
  audience: 'both',
  aiMetadata: {
    description:
      'Permanently deletes a branch (git ref under heads/) from a repository. Use to clean up a merged or stale branch. Effectively idempotent for the end state (the branch ends up gone), but a repeat call on an already-deleted branch returns a not-found error.',
    idempotent: false,
  },
  props: {
    repository: githubCommon.repositoryDropdown,
    branch: githubCommon.branchDropdown('Branch', '', true),
  },
  async run({ auth, propsValue }) {
    const { owner, repo } = propsValue.repository!;
    const branchName = propsValue.branch;

    const response = await githubApiCall({
      auth,
      method: HttpMethod.DELETE,

      resourceUri: `/repos/${owner}/${repo}/git/refs/heads/${branchName}`,
    });

    return response;
  },
});
