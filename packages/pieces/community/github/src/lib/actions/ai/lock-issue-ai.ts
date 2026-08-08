import { createAction, Property } from '@activepieces/pieces-framework';
import { githubAuth } from '../../auth';
import { githubApiCall } from '../../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const githubLockIssueAiAction = createAction({
  auth: githubAuth,
  name: 'lock_issue_ai',
  displayName: 'Lock Issue (Agent)',
  description: 'Locks an issue or pull request conversation.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Locks an issue (PUT /repos/{owner}/{repo}/issues/{issue_number}/lock) so only collaborators can comment, optionally recording a lock reason (off-topic, too heated, resolved, or spam). Works on pull request numbers too. Use Unlock Issue to reverse. Idempotent: re-locking an already-locked issue leaves it locked.',
    idempotent: true,
  },
  props: {
    owner: Property.ShortText({
      displayName: 'Owner',
      description:
        'Repository owner login (user or org). Resolve via List My Repositories or Search Repositories.',
      required: true,
    }),
    repo: Property.ShortText({
      displayName: 'Repository',
      description: 'Repository name (without the owner prefix).',
      required: true,
    }),
    issue_number: Property.Number({
      displayName: 'Issue Number',
      description:
        'The issue or pull request number to lock. Resolve via List Repository Issues.',
      required: true,
    }),
    lock_reason: Property.StaticDropdown({
      displayName: 'Lock Reason',
      description: 'The reason for locking the issue.',
      required: false,
      options: {
        options: [
          { label: 'Off-topic', value: 'off-topic' },
          { label: 'Too heated', value: 'too heated' },
          { label: 'Resolved', value: 'resolved' },
          { label: 'Spam', value: 'spam' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    const { owner, repo, issue_number, lock_reason } = propsValue;
    const body: Record<string, unknown> = {};
    if (lock_reason !== undefined) body['lock_reason'] = lock_reason;
    try {
      const response = await githubApiCall({
        auth,
        method: HttpMethod.PUT,
        resourceUri: `/repos/${owner}/${repo}/issues/${issue_number}/lock`,
        body,
      });
      return { success: true, status: response.status, locked: true };
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 404)
        throw new Error(
          `Issue #${issue_number} not found in ${owner}/${repo}.`
        );
      if (status === 403)
        throw new Error('Permission denied locking the issue.');
      throw error;
    }
  },
});
