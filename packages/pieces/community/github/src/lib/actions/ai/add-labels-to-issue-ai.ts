import { createAction, Property } from '@activepieces/pieces-framework';
import { githubAuth } from '../../auth';
import { githubApiCall } from '../../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const githubAddLabelsToIssueAiAction = createAction({
  auth: githubAuth,
  name: 'add_labels_to_issue_ai',
  displayName: 'Add Labels to Issue (Agent)',
  description: 'Adds labels to an issue without removing existing ones.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Adds one or more labels to an existing issue (POST /repos/{owner}/{repo}/issues/{issue_number}/labels), leaving any labels already on the issue in place (ADDITIVE). To replace the whole set use Set Issue Labels; to remove one use Remove Label from Issue. Works on pull request numbers too. Resolve label names via List Repository Labels. Idempotent in effect: re-adding a label already present does not duplicate it.',
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
        'The issue or pull request number. Resolve via List Repository Issues.',
      required: true,
    }),
    labels: Property.Array({
      displayName: 'Labels',
      description: 'Label names to add. Resolve via List Repository Labels.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { owner, repo, issue_number } = propsValue;
    const labels = propsValue.labels as string[];
    try {
      const response = await githubApiCall({
        auth,
        method: HttpMethod.POST,
        resourceUri: `/repos/${owner}/${repo}/issues/${issue_number}/labels`,
        body: { labels },
      });
      return response.body;
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 404)
        throw new Error(
          `Issue #${issue_number} not found in ${owner}/${repo}.`
        );
      if (status === 403) throw new Error('Permission denied adding labels.');
      throw error;
    }
  },
});
