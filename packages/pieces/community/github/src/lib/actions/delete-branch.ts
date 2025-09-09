import { createAction, Property } from '@activepieces/pieces-framework';
import { githubAuth } from '../../index';
import { githubApiCall, githubCommon } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const githubDeleteBranchAction = createAction({
  auth: githubAuth,
  name: 'deleteBranch',
  displayName: 'Delete Branch',
  description: 'Deletes a branch by name',
  props: {
    repository: githubCommon.repositoryDropdown,
    branch: Property.ShortText({
      displayName: 'Branch Name',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { owner, repo } = propsValue.repository!;
    const { branch } = propsValue as any;

    const response = await githubApiCall({
      accessToken: auth.access_token,
      method: HttpMethod.DELETE,
      resourceUri: `/repos/${owner}/${repo}/git/refs/heads/${encodeURIComponent(branch)}`,
    });

    return response;
  },
});

