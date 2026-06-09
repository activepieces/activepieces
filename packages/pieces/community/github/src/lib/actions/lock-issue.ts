import { githubAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { githubApiCall, githubCommon } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const githubLockIssueAction = createAction({
  auth: githubAuth,
  name: 'lockIssue',
  displayName: 'Lock issue',
  description: 'Locks the specified issue',
  audience: 'both',
  aiMetadata: {
    description:
      'Locks an issue (by number) so only collaborators can comment, optionally recording a lock reason (off-topic, too heated, resolved, or spam). Use to freeze discussion on an issue or pull request. Idempotent: re-locking an already-locked issue leaves it locked.',
    idempotent: true,
  },
  props: {
    repository: githubCommon.repositoryDropdown,
    issue_number: Property.Number({
      displayName: 'Issue Number',
      description: 'The number of the issue to be locked',
      required: true,
    }),
    lock_reason: Property.Dropdown<
      'off-topic' | 'too heated' | 'resolved' | 'spam' | undefined,
      false,
      typeof githubAuth
    >({
      auth: githubAuth,
      displayName: 'Lock Reason',
      description: 'The reason for locking the issue',
      required: false,
      refreshers: [],
      options: async () => {
        return {
          options: [
            { value: 'off-topic', label: 'Off-topic' },
            { value: 'too heated', label: 'Too heated' },
            { value: 'resolved', label: 'Resolved' },
            { value: 'spam', label: 'Spam' },
          ],
        };
      },
    }),
  },
  async run({ auth, propsValue }) {
    const { issue_number, lock_reason } = propsValue;
    const { owner, repo } = propsValue.repository!;

    const response = await githubApiCall({
      auth,
      method: HttpMethod.PUT,
      resourceUri: `/repos/${owner}/${repo}/issues/${issue_number}/lock`,
      body: {
        lock_reason,
      },
    });
    return response;
  },
});
