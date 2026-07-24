import { createAction, Property } from '@activepieces/pieces-framework';
import { githubAuth } from '../../auth';
import { githubApiCall } from '../../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { ownerProp, repoProp, githubError } from './common';

export const githubSetIssueLabelsAction = createAction({
  auth: githubAuth,
  name: 'set_issue_labels',
  displayName: 'Set Issue Labels (Agent)',
  description: 'Replaces the entire label set on an issue or pull request.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Replaces ALL labels on an issue with the provided set (PUT /repos/{owner}/{repo}/issues/{issue_number}/labels). Differs from Add Labels to Issue (additive): any label not in the list is removed. Pass an empty array to clear all labels. Works on pull request numbers too. Resolve names via List Repository Labels. Idempotent: re-applying the same set converges to that exact set.',
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
    labels: Property.Array({
      displayName: 'Labels',
      description:
        'The complete label set to apply (replaces existing). Empty clears all. Resolve names via List Repository Labels.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { owner, repo, issue_number } = propsValue;
    const labels = propsValue.labels as string[];
    try {
      const response = await githubApiCall({
        auth,
        method: HttpMethod.PUT,
        resourceUri: `/repos/${owner}/${repo}/issues/${issue_number}/labels`,
        body: { labels },
      });
      return response.body;
    } catch (error: any) {
      throw githubError(error, `Issue #${issue_number} in ${owner}/${repo}`);
    }
  },
});
