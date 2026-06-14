import { githubAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { githubApiCall, githubCommon } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const githubUnlockIssueAction = createAction({
  auth: githubAuth,
  name: 'unlockIssue',
  displayName: 'Unlock issue',
  description: 'Unlocks the specified issue',
  audience: 'both',
  aiMetadata: {
    description:
      'Removes the conversation lock from an issue (by number) so anyone can comment again. Use to re-open discussion on a previously locked issue or pull request. Idempotent: unlocking an already-unlocked issue leaves it unlocked.',
    idempotent: true,
  },
  props: {
    repository: githubCommon.repositoryDropdown,
    issue_number: Property.Number({
      displayName: 'Issue Number',
      description: 'The number of the issue to be unlocked',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { issue_number } = propsValue;
    const { owner, repo } = propsValue.repository!;

    const response = await githubApiCall({
      auth,
      method: HttpMethod.DELETE,
      resourceUri: `/repos/${owner}/${repo}/issues/${issue_number}/lock`,
    });

    return response;
  },
});
