import { createAction, Property } from '@activepieces/pieces-framework';
import { githubAuth } from '../../auth';
import { githubApiCall } from '../../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const githubCreatePullRequestReviewCommentAiAction = createAction({
  auth: githubAuth,
  name: 'create_pull_request_review_comment_ai',
  displayName: 'Create Pull Request Review Comment (Agent)',
  description: 'Posts an inline review comment on a pull request.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Posts an inline review comment on a pull request (POST /repos/{owner}/{repo}/pulls/{pull_number}/comments), anchored to a commit SHA, file path, and diff position. Use to comment on a specific line of changed code (for a general PR comment use Create Issue Comment instead). Get commit_id/path via List Pull Request Files or Get Pull Request. Not idempotent: each call adds a new review comment.',
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
    pull_number: Property.Number({
      displayName: 'Pull Request Number',
      description: 'The pull request number. Resolve via List Pull Requests.',
      required: true,
    }),
    commit_id: Property.ShortText({
      displayName: 'Commit SHA',
      description:
        'The SHA of the commit to comment on. Get via Get Pull Request (head.sha) or List Pull Request Commits.',
      required: true,
    }),
    path: Property.ShortText({
      displayName: 'File Path',
      description:
        'The relative path of the file to comment on. Get via List Pull Request Files.',
      required: true,
    }),
    body: Property.LongText({
      displayName: 'Comment Body',
      description: 'The content of the review comment.',
      required: true,
    }),
    position: Property.Number({
      displayName: 'Position',
      description:
        'The line index in the diff (counting from the first @@ hunk header) where the comment is placed.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { owner, repo, pull_number, commit_id, path, body, position } =
      propsValue;
    try {
      const response = await githubApiCall({
        auth,
        method: HttpMethod.POST,
        resourceUri: `/repos/${owner}/${repo}/pulls/${pull_number}/comments`,
        body: { commit_id, path, body, position },
      });
      return response.body;
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 404)
        throw new Error(
          `Pull request #${pull_number} not found in ${owner}/${repo}.`
        );
      if (status === 422)
        throw new Error(
          'Invalid review comment (check commit_id, path, and position match the PR diff).'
        );
      if (status === 403)
        throw new Error('Permission denied creating the review comment.');
      throw error;
    }
  },
});
