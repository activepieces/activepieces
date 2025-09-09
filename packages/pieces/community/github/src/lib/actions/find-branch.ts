import { createAction, Property } from '@activepieces/pieces-framework';
import { githubAuth } from '../../index';
import { githubApiCall, githubCommon, RepositoryProp } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const findBranch = createAction({
  auth: githubAuth,
  name: 'findBranch',
  displayName: 'Find Branch',
  description: '',
  props: {
    repository: githubCommon.repositoryDropdown,
    branchName: Property.ShortText({
      displayName: 'Branch Name',
      description: 'The name of the branch to find',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { owner, repo } = propsValue.repository as RepositoryProp;
    const response = await githubApiCall({
      accessToken: auth.access_token,
      method: HttpMethod.GET,
      resourceUri: `/repos/${owner}/${repo}/branches/${propsValue.branchName}`,
    });
    return response.body;
  },
});
