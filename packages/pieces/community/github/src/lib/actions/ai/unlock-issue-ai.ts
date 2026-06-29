import { createAction, Property } from '@activepieces/pieces-framework';
import { githubAuth } from '../../auth';
import { githubApiCall } from '../../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const githubUnlockIssueAiAction = createAction({
  auth: githubAuth,
  name: 'unlock_issue_ai',
  displayName: 'Unlock Issue (Agent)',
  description: 'Removes the conversation lock from an issue or pull request.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Removes the conversation lock from an issue (DELETE /repos/{owner}/{repo}/issues/{issue_number}/lock) so anyone can comment again. Works on pull request numbers too. Idempotent: unlocking an already-unlocked issue leaves it unlocked.',
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
        'The issue or pull request number to unlock. Resolve via List Repository Issues.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { owner, repo, issue_number } = propsValue;
    try {
      const response = await githubApiCall({
        auth,
        method: HttpMethod.DELETE,
        resourceUri: `/repos/${owner}/${repo}/issues/${issue_number}/lock`,
      });
      return { success: true, status: response.status, locked: false };
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 404)
        throw new Error(
          `Issue #${issue_number} not found in ${owner}/${repo}.`
        );
      if (status === 403)
        throw new Error('Permission denied unlocking the issue.');
      throw error;
    }
  },
});
