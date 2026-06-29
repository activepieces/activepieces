import { createAction, Property } from '@activepieces/pieces-framework';
import { githubAuth } from '../../auth';
import { githubApiCall } from '../../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { ownerProp, repoProp, githubError } from './common';

export const githubAddAssigneesToIssueAction = createAction({
  auth: githubAuth,
  name: 'add_assignees_to_issue',
  displayName: 'Add Assignees to Issue (Agent)',
  description: 'Assigns users to an issue or pull request.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Assigns up to 10 users to an issue (POST /repos/{owner}/{repo}/issues/{issue_number}/assignees), keeping existing assignees (ADDITIVE). Works on pull request numbers too. Resolve assignable logins via List Assignees. Idempotent: re-adding an existing assignee is a no-op. Note: logins that cannot be assigned are silently ignored by GitHub.',
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
    assignees: Property.Array({
      displayName: 'Assignees',
      description:
        'User logins to assign (max 10). Resolve via List Assignees.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { owner, repo, issue_number } = propsValue;
    const assignees = propsValue.assignees as string[];
    try {
      const response = await githubApiCall({
        auth,
        method: HttpMethod.POST,
        resourceUri: `/repos/${owner}/${repo}/issues/${issue_number}/assignees`,
        body: { assignees },
      });
      return response.body;
    } catch (error: any) {
      throw githubError(error, `Issue #${issue_number} in ${owner}/${repo}`);
    }
  },
});
