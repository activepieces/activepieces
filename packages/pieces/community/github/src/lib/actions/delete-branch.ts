import { createAction, Property } from '@activepieces/pieces-framework';
import { githubAuth } from '../../index';
import { githubApiCall, githubCommon, RepositoryProp } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const deleteBranch = createAction({
  auth: githubAuth,
  name: 'deleteBranch',
  displayName: 'Delete Branch',
  description: '',
  props: {
    repository: githubCommon.repositoryDropdown,
    branchName: githubCommon.branchDropdown(true),
  },
  async run({ auth, propsValue }) {
    const { owner, repo } = propsValue.repository as RepositoryProp;
    const response = await githubApiCall({
      accessToken: auth.access_token,
      method: HttpMethod.DELETE,
      resourceUri: `/repos/${owner}/${repo}/git/refs/heads/${propsValue.branchName}`,
    });
    console.log(response);
    return {
      success: response.status === 204,
      message:
        response.status === 204
          ? 'Branch deleted successfully'
          : 'Failed to delete branch',
    };
  },
});
