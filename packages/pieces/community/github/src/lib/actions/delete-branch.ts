import {
  createAction,
  MarkdownVariant,
  Property,
} from '@activepieces/pieces-framework';
import { githubAuth } from '../auth';
import { githubApiCall, githubCommon } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const githubDeleteBranchAction = createAction({
  auth: githubAuth,
  name: 'delete_branch',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Branch',
  description: 'Permanently deletes a branch.',
  audience: 'human',
  aiMetadata: {
    description:
      'Permanently deletes a branch (git ref under heads/) from a repository. Use to clean up a merged or stale branch. Effectively idempotent for the end state (the branch ends up gone), but a repeat call on an already-deleted branch returns a not-found error.',
    idempotent: false,
  },
  props: {
    deleteWarning: Property.MarkDown({
      value: 'The branch is deleted on GitHub as soon as this step runs.',
      variant: MarkdownVariant.WARNING,
    }),
    repository: githubCommon.repositoryDropdown,
    branch: githubCommon.branchDropdown('Branch', '', true),
  },
  propertyGroups: [
    {
      key: 'branch',
      display: 'section',
      label: 'Branch to delete',
      icon: 'trash',
      props: ['deleteWarning', 'repository', 'branch'],
    },
  ],
  async run({ auth, propsValue }) {
    const { owner, repo } = propsValue.repository!;
    const branchName = propsValue.branch;

    const response = await githubApiCall({
      auth,
      method: HttpMethod.DELETE,

      resourceUri: `/repos/${owner}/${repo}/git/refs/heads/${branchName}`,
    });

    return response;
  },
});
