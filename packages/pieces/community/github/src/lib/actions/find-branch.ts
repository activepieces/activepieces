import { createAction, Property } from '@activepieces/pieces-framework';
import { githubAuth } from '../auth';
import { githubApiCall, githubCommon } from '../common';
import { HttpError, HttpMethod } from '@activepieces/pieces-common';
import { HttpStatusCode } from 'axios';

export const githubFindBranchAction = createAction({
  auth: githubAuth,
  name: 'find_branch',
  displayName: 'Find Branch',
  description: 'Finds a branch by name and returns its details.',
  audience: 'both',
  aiMetadata: {
    description:
      'Looks up a branch in a repository by its exact name and reports whether it exists along with its details. Use to check for a branch or fetch its tip before acting on it; a missing branch is reported as not-found rather than raising an error. Read-only and idempotent.',
    idempotent: true,
  },
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
        auth,
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
