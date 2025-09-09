import { githubAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import { githubApiCall, githubCommon } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const githubFindBranch = createAction({
  auth: githubAuth,
  name: 'findBranch',
  displayName: 'Find Branch',
  description: 'Get information about a specific branch in a repository',
  props: {
    repository: githubCommon.repositoryDropdown,
    branch: Property.ShortText({
      displayName: 'Branch Name',
      description: 'The name of the branch to find (e.g., main, develop, feature/new-feature)',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { owner, repo } = propsValue.repository!;
    const branch = propsValue.branch;

    const response = await githubApiCall({
      accessToken: auth.access_token,
      method: HttpMethod.GET,
      resourceUri: `/repos/${owner}/${repo}/branches/${encodeURIComponent(branch)}`,
    });

    return response;
  },
});
