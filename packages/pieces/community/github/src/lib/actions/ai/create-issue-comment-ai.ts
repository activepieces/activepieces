import { createAction, Property } from '@activepieces/pieces-framework';
import { githubAuth } from '../../auth';
import { githubApiCall } from '../../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const githubCreateIssueCommentAiAction = createAction({
  auth: githubAuth,
  name: 'create_issue_comment_ai',
  displayName: 'Create Issue Comment (Agent)',
  description: 'Posts a comment on an issue or pull request.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Posts a comment on an issue (POST /repos/{owner}/{repo}/issues/{issue_number}/comments). Pull requests share the issue number space, so this also adds a general PR comment (for an inline code-review comment use Create Pull Request Review Comment instead). Not idempotent: each call appends a new comment.',
    idempotent: false,
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
        'The issue or pull request number to comment on. Resolve via List Repository Issues / List Pull Requests.',
      required: true,
    }),
    body: Property.LongText({
      displayName: 'Comment Body',
      description: 'The comment text to add.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { owner, repo, issue_number, body } = propsValue;
    try {
      const response = await githubApiCall({
        auth,
        method: HttpMethod.POST,
        resourceUri: `/repos/${owner}/${repo}/issues/${issue_number}/comments`,
        body: { body },
      });
      return response.body;
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 404)
        throw new Error(
          `Issue #${issue_number} not found in ${owner}/${repo}.`
        );
      if (status === 403)
        throw new Error('Permission denied commenting on the issue.');
      throw error;
    }
  },
});
