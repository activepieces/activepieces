import { githubAuth } from '../auth';
import {
  createAction,
  MarkdownVariant,
  Property,
} from '@activepieces/pieces-framework';
import { githubApiCall, githubCommon } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { createCommitCommentActionOutputSchema } from '../output-schemas';

export const githubCreateCommitCommentAction = createAction({
  auth: githubAuth,
  name: 'github_create_commit_comment',
  classification: 'WRITE',
  displayName: 'Create Commit Comment',
  description: 'Comments on a commit, or on one line of its diff.',
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
      description: 'The full or short commit hash.',
      placeholder: '6dcb09b',
      required: true,
    }),
    body: Property.LongText({
      displayName: 'Comment',
      description: 'Markdown is supported.',
      required: true,
    }),
    lineNote: Property.MarkDown({
      value: 'Leave both empty to comment on the whole commit.',
      variant: MarkdownVariant.INFO,
    }),
    path: Property.ShortText({
      displayName: 'File Path',
      description: 'Relative to the repository root.',
      placeholder: 'src/index.ts',
      required: false,
      width: 'half',
    }),
    position: Property.Number({
      displayName: 'Position',
      description:
        'Lines down from the first @@ hunk header. Needs a file path.',
      required: false,
      width: 'half',
    }),
  },
  propertyGroups: [
    {
      key: 'commit',
      display: 'section',
      label: 'Commit',
      icon: 'code',
      props: ['repository', 'sha'],
    },
    {
      key: 'comment',
      display: 'section',
      label: 'Comment',
      icon: 'reply',
      props: ['body'],
    },
    {
      key: 'line',
      display: 'section',
      label: 'Line in the diff',
      icon: 'file',
      props: ['lineNote', 'path', 'position'],
    },
  ],
  outputSchema: createCommitCommentActionOutputSchema,
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
