import { createAction, Property } from '@activepieces/pieces-framework';
import { githubAuth } from '../../index';
import { githubApiCall, githubCommon } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const githubCreateBranchAction = createAction({
  auth: githubAuth,
  name: 'create_branch',
  displayName: 'Create Branch',
  description: 'Creates a new branch on a repository.',
  props: {
    repository: githubCommon.repositoryDropdown,
    source_branch: githubCommon.branchDropdown(),
    new_branch_name: Property.ShortText({
      displayName: 'New Branch Name',
      description: "The name for the new branch (e.g., 'feature/new-design').",
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { owner, repo } = propsValue.repository!;
    
    // 1. Get the SHA of the source branch's latest commit
    const sourceBranchInfo = await githubApiCall<{ commit: { sha: string } }>({
        accessToken: auth.access_token,
        method: HttpMethod.GET,
        resourceUri: `/repos/${owner}/${repo}/branches/${propsValue.source_branch}`,
    });
    const sourceSha = sourceBranchInfo.body.commit.sha;

    // 2. Create the new branch by creating a new git ref
    const response = await githubApiCall({
      accessToken: auth.access_token,
      method: HttpMethod.POST,
      resourceUri: `/repos/${owner}/${repo}/git/refs`,
      body: {
        ref: `refs/heads/${propsValue.new_branch_name}`,
        sha: sourceSha,
      },
    });

    // The API returns a 201 Created status on success
    return response.body;
  },
});