import { createAction, Property } from '@activepieces/pieces-framework';
import { githubAuth } from '../../auth';
import { githubApiCall } from '../../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { ownerProp, repoProp, githubError } from './common';

export const githubRemoveAssigneesFromIssueAction = createAction({
  auth: githubAuth,
  name: 'remove_assignees_from_issue',
  displayName: 'Remove Assignees from Issue (Agent)',
  description: 'Unassigns users from an issue or pull request.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Removes the given users from an issue (DELETE /repos/{owner}/{repo}/issues/{issue_number}/assignees). Works on pull request numbers too. Idempotent: removing a user who is not assigned ends in the same state. Get current assignees via Get Issue.',
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
      description: 'User logins to unassign.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { owner, repo, issue_number } = propsValue;
    const assignees = propsValue.assignees as string[];
    try {
      const response = await githubApiCall({
        auth,
        method: HttpMethod.DELETE,
        resourceUri: `/repos/${owner}/${repo}/issues/${issue_number}/assignees`,
        body: { assignees },
      });
      return response.body;
    } catch (error: any) {
      throw githubError(error, `Issue #${issue_number} in ${owner}/${repo}`);
    }
  },
});
