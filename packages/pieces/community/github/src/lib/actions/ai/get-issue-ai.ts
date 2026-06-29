import { createAction, Property } from '@activepieces/pieces-framework';
import { githubAuth } from '../../auth';
import { githubApiCall } from '../../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const githubGetIssueAiAction = createAction({
  auth: githubAuth,
  name: 'get_issue_ai',
  displayName: 'Get Issue (Agent)',
  description: 'Fetches the full details of a single issue by number.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Fetches a single issue (GET /repos/{owner}/{repo}/issues/{issue_number}) by its number, returning its current state, title, body, labels, and assignees. Works on pull request numbers too (issues and PRs share the number space). Resolve issue numbers via List Repository Issues or Search Issues and Pull Requests. Read-only and idempotent.',
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
        'The issue (or pull request) number. Resolve via List Repository Issues or Search Issues and Pull Requests.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { owner, repo, issue_number } = propsValue;
    try {
      const response = await githubApiCall({
        auth,
        method: HttpMethod.GET,
        resourceUri: `/repos/${owner}/${repo}/issues/${issue_number}`,
      });
      return response.body;
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 404)
        throw new Error(
          `Issue #${issue_number} not found in ${owner}/${repo}.`
        );
      if (status === 403)
        throw new Error('Permission denied reading the issue.');
      throw error;
    }
  },
});
