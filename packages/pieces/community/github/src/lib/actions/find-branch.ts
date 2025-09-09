import { createAction } from '@activepieces/pieces-framework';
import { githubAuth } from '../../index';
import { githubApiCall, githubCommon } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const githubFindBranchAction = createAction({
  auth: githubAuth,
  name: 'find_branch',
  displayName: 'Find Branch',
  description: 'Locates a branch by name and returns its details.',
  props: {
    repository: githubCommon.repositoryDropdown,
    branch: githubCommon.branchDropdown(),
  },
  async run({ auth, propsValue }) {
    const { owner, repo } = propsValue.repository!;
    const branchName = propsValue.branch;

    const response = await githubApiCall({
      accessToken: auth.access_token,
      method: HttpMethod.GET,
      resourceUri: `/repos/${owner}/${repo}/branches/${branchName}`,
    });

    return response.body;
  },
});