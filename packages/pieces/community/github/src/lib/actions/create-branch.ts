import { createAction, Property } from '@activepieces/pieces-framework';
import { githubAuth } from '../../index';
import { githubApiCall, githubCommon, RepositoryProp } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const createBranch = createAction({
  auth: githubAuth,
  name: 'createBranch',
  displayName: 'Create Branch',
  description: '',
  props: {
    repository: githubCommon.repositoryDropdown,
    branchName: Property.ShortText({
      displayName: 'Branch Name',
      description: 'The name of the branch to create',
      required: true,
    }),
    sha: Property.ShortText({
      displayName: 'SHA',
      description: 'The SHA of the commit to create the branch from',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { owner, repo } = propsValue.repository as RepositoryProp;

    const response = await githubApiCall({
      accessToken: auth.access_token,
      method: HttpMethod.POST,
      resourceUri: `/repos/${owner}/${repo}/git/refs`,
      body: {
        ref: `refs/heads/${propsValue.branchName}`,
        sha: propsValue.sha,
      },
    });

    return response.body;
  },
});
