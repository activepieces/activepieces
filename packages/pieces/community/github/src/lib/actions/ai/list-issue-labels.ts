import { createAction, Property } from '@activepieces/pieces-framework';
import { githubAuth } from '../../auth';
import { githubPaginatedApiCall } from '../../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { ownerProp, repoProp, githubError } from './common';

export const githubListIssueLabelsAction = createAction({
  auth: githubAuth,
  name: 'list_issue_labels',
  displayName: 'List Issue Labels (Agent)',
  description: 'Lists the labels currently on an issue or pull request.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the labels currently attached to an issue (GET /repos/{owner}/{repo}/issues/{issue_number}/labels). Use this to resolve which label names to pass to Remove Label from Issue. Works on pull request numbers too. Read-only and idempotent.',
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
        resourceUri: `/repos/${owner}/${repo}/issues/${issue_number}/labels`,
      });
      return { items, count: items.length };
    } catch (error: any) {
      throw githubError(error, `Issue #${issue_number} in ${owner}/${repo}`);
    }
  },
});
