import { githubAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { githubApiCall, githubCommon } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { createPullRequestReviewCommentActionOutputSchema } from '../output-schemas';

export const githubCreatePullRequestReviewCommentAction = createAction({
  auth: githubAuth,
  name: 'github_create_pull_request_review_comment',
  classification: 'WRITE',
  displayName: 'Create Pull Request Review Comment',
  description: "Comments on one line of a pull request's diff.",
  audience: 'human',
  aiMetadata: {
    description:
      'Posts an inline review comment on a pull request, anchored to a specific commit SHA, file path, and diff position. Use to comment on a particular line of changed code in a PR (not a general PR comment — use Create Comment on a Issue for that). Not idempotent: each call adds a new review comment.',
    idempotent: false,
  },
  props: {
    repository: githubCommon.repositoryDropdown,
    pull_number: Property.Number({
      displayName: 'Pull Request Number',
      description: 'The number shown after # on GitHub.',
      required: true,
    }),
    commit_id: Property.ShortText({
      displayName: 'Commit SHA',
      description: "Use the pull request's latest commit.",
      placeholder: '6dcb09b',
      required: true,
    }),
    path: Property.ShortText({
      displayName: 'File Path',
      description: 'Relative to the repository root.',
      placeholder: 'src/index.ts',
      required: true,
      width: 'half',
    }),
    body: Property.LongText({
      displayName: 'Comment',
      description: 'Markdown is supported.',
      required: true,
    }),
    position: Property.Number({
      displayName: 'Position',
      description: 'Lines down from the first @@ hunk header in this file.',
      required: true,
      width: 'half',
    }),
  },
  propertyGroups: [
    {
      key: 'pr',
      display: 'section',
      label: 'Pull request',
      icon: 'code',
      props: ['repository', 'pull_number', 'commit_id'],
    },
    {
      key: 'line',
      display: 'section',
      label: 'Line in the diff',
      icon: 'file',
      props: ['path', 'position'],
    },
    {
      key: 'comment',
      display: 'section',
      label: 'Comment',
      icon: 'reply',
      props: ['body'],
    },
  ],
  outputSchema: createPullRequestReviewCommentActionOutputSchema,
  async run({ auth, propsValue }) {
    const { pull_number, commit_id, path, body, position } = propsValue;
    const { owner, repo } = propsValue.repository!;

    const response = await githubApiCall({
      auth,
      method: HttpMethod.POST,
      resourceUri: `/repos/${owner}/${repo}/pulls/${pull_number}/comments`,
      body: {
        commit_id,
        path,
        body,
        position,
      },
    });

    return response;
  },
});
