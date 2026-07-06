import { githubAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { githubApiCall, githubCommon } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const githubCreateCommitCommentAction = createAction({
  auth: githubAuth,
  name: 'github_create_commit_comment',
  displayName: 'Create Commit Comment',
  description: 'Creates a comment on a commit in a GitHub repository',
  audience: 'both',
  aiMetadata: {
    description:
      'Posts a comment on a specific commit identified by its SHA, optionally anchored to a file path and diff position. Use to leave feedback on a committed change directly on the commit. Not idempotent: each call adds a new comment.',
    idempotent: false,
  },
  props: {
    repository: githubCommon.repositoryDropdown,
    sha: Property.ShortText({
      displayName: 'Commit SHA',
      description: 'The SHA of the commit to comment on',
      required: true,
    }),
    body: Property.LongText({
      displayName: 'Comment Body',
      description: 'The content of the comment',
      required: true,
    }),
    path: Property.ShortText({
      displayName: 'File Path',
      description: 'The relative path to the file to comment on (optional)',
      required: false,
    }),
    position: Property.Number({
      displayName: 'Position',
      description: 'The line index in the diff to comment on (optional)',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { sha, body, path, position } = propsValue;
    const { owner, repo } = propsValue.repository!;

    const commentData: Record<string, any> = {
      body,
    };

    if (path) {
      commentData.path = path;
    }

    if (position !== undefined) {
      commentData.position = position;
    }

    const response = await githubApiCall({
      auth,
      method: HttpMethod.POST,
      resourceUri: `/repos/${owner}/${repo}/commits/${sha}/comments`,
      body: commentData,
    });

    return response;
  },
});
