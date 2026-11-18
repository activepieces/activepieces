import { createAction, Property } from '@activepieces/pieces-framework';
import { githubAuth } from '../auth';
import { githubApiCall, githubCommon } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { createBranchActionOutputSchema } from '../output-schemas';

export const githubCreateBranchAction = createAction({
  auth: githubAuth,
  name: 'create_branch',
  classification: 'WRITE',
  displayName: 'Create Branch',
  description: 'Creates a branch from an existing one.',
  audience: 'human',
  aiMetadata: {
    description:
      'Creates a new branch in a repository pointing at the tip of a chosen source branch. Use to start a feature or working branch from an existing one. Not idempotent: a second call with the same branch name fails because the ref already exists.',
    idempotent: false,
  },
  props: {
    repository: githubCommon.repositoryDropdown,
    source_branch: githubCommon.branchDropdown(
      'Source Branch',
      "The new branch starts from this branch's latest commit.",
      true
    ),
    new_branch_name: Property.ShortText({
      displayName: 'New Branch Name',
      placeholder: 'feature/new-design',
      required: true,
    }),
  },
  propertyGroups: [
    {
      key: 'source',
      display: 'section',
      label: 'Start from',
      icon: 'code',
      props: ['repository', 'source_branch'],
    },
    {
      key: 'branch',
      display: 'section',
      label: 'New branch',
      icon: 'tag',
      props: ['new_branch_name'],
    },
  ],
  outputSchema: createBranchActionOutputSchema,
  async run({ auth, propsValue }) {
    const { owner, repo } = propsValue.repository!;

    const sourceBranchInfo = await githubApiCall<{ commit: { sha: string } }>({
      auth,
      method: HttpMethod.GET,
      resourceUri: `/repos/${owner}/${repo}/branches/${propsValue.source_branch}`,
    });
    const sourceSha = sourceBranchInfo.body.commit.sha;

    const response = await githubApiCall({
      auth,
      method: HttpMethod.POST,
      resourceUri: `/repos/${owner}/${repo}/git/refs`,
      body: {
        ref: `refs/heads/${propsValue.new_branch_name}`,
        sha: sourceSha,
      },
    });

    return response;
  },
});
