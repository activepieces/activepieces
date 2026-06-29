import { createAction, Property } from '@activepieces/pieces-framework';
import { githubAuth } from '../../auth';
import { githubPaginatedApiCall } from '../../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { ownerProp, repoProp, githubError } from './common';

export const githubListIssueCommentsAction = createAction({
  auth: githubAuth,
  name: 'list_issue_comments',
  displayName: 'List Issue Comments (Agent)',
  description: 'Lists the comments on an issue or pull request.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the comment thread on an issue (GET /repos/{owner}/{repo}/issues/{issue_number}/comments). Works on pull request numbers too (issues and PRs share the number space). Returns all pages. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    owner: ownerProp,
    repo: repoProp,
    issue_number: Property.Number({
      displayName: 'Issue Number',
      description:
        'The issue or pull request number. Resolve via List Repository Issues.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { owner, repo, issue_number } = propsValue;
    try {
      const items = await githubPaginatedApiCall<Record<string, unknown>>({
        auth,
        method: HttpMethod.GET,
        resourceUri: `/repos/${owner}/${repo}/issues/${issue_number}/comments`,
      });
      return { items, count: items.length };
    } catch (error: any) {
      throw githubError(error, `Issue #${issue_number} in ${owner}/${repo}`);
    }
  },
});
