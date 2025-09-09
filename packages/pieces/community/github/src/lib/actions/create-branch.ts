import { createAction, Property } from '@activepieces/pieces-framework';
import { githubAuth } from '../../index';
import { githubApiCall, githubCommon } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const githubCreateBranchAction = createAction({
  auth: githubAuth,
  name: 'createBranch',
  displayName: 'Create Branch',
  description: 'Creates a new branch from a base branch',
  props: {
    repository: githubCommon.repositoryDropdown,
    base_branch: Property.ShortText({
      displayName: 'Base Branch',
      description: 'Branch to create from (e.g., main)',
      required: true,
      defaultValue: 'main',
    }),
    new_branch: Property.ShortText({
      displayName: 'New Branch Name',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { owner, repo } = propsValue.repository!;
    const { base_branch, new_branch } = propsValue as any;

    // Get base branch SHA
    const refResp = await githubApiCall<{ object: { sha: string } }>({
      accessToken: auth.access_token,
      method: HttpMethod.GET,
      resourceUri: `/repos/${owner}/${repo}/git/ref/heads/${encodeURIComponent(base_branch)}`,
    });
    const sha = (refResp.body as any).object?.sha ?? (refResp.body as any).sha;

    const response = await githubApiCall({
      accessToken: auth.access_token,
      method: HttpMethod.POST,
      resourceUri: `/repos/${owner}/${repo}/git/refs`,
      body: {
        ref: `refs/heads/${new_branch}`,
        sha,
      },
    });

    return response;
  },
});

