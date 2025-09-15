import { createAction, Property } from '@activepieces/pieces-framework';
import { githubAuth } from '../../index';
import { githubApiCall, githubCommon } from '../common';
import { HttpError, HttpMethod } from '@activepieces/pieces-common';
import { HttpStatusCode } from 'axios';

export const githubFindBranchAction = createAction({
  auth: githubAuth,
  name: 'find_branch',
  displayName: 'Find Branch',
  description: 'Finds a branch by name and returns its details.',
  props: {
    repository: githubCommon.repositoryDropdown,
    branch: Property.ShortText({
      displayName: 'Branch Name',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { owner, repo } = propsValue.repository!;
    const branchName = propsValue.branch;

    try {
      const response = await githubApiCall({
        accessToken: auth.access_token,
        method: HttpMethod.GET,
        resourceUri: `/repos/${owner}/${repo}/branches/${branchName}`,
      });

      return {
        found: true,
        result: response.body,
      };
    } catch (e) {
      const status = (e as HttpError).response.status;
      if (status === HttpStatusCode.NotFound) {
        return {
          found: false,
          result: {},
        };
      }
      throw e;
    }
  },
});
