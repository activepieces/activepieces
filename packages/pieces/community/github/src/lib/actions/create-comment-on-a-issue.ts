import { githubAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { githubApiCall, githubCommon } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { createCommentActionOutputSchema } from '../output-schemas';

export const githubCreateCommentOnAIssue = createAction({
  auth: githubAuth,
  name: 'createCommentOnAIssue',
  classification: 'WRITE',
  displayName: 'Create Comment on Issue',
  description: 'Adds a comment to an issue or pull request.',
  audience: 'human',
  aiMetadata: {
    description:
      'Posts a comment on an issue (or pull request, which shares the issue number space) in a repository. Use to add a reply or note to an existing issue/PR identified by its number. Not idempotent: each call appends a new comment.',
    idempotent: false,
  },
  propertyGroups: [
    {
      key: 'issue',
      display: 'section',
      label: 'Issue',
      icon: 'inbox',
      props: ['repository', 'issue_number'],
    },
    {
      key: 'comment',
      display: 'section',
      label: 'Comment',
      icon: 'reply',
      props: ['comment'],
    },
  ],
  props: {
    repository: githubCommon.repositoryDropdown,
    issue_number: Property.Number({
      displayName: 'Issue Number',
      description: 'Pull request numbers work too.',
      required: true,
    }),
    comment: Property.LongText({
      displayName: 'Comment',
      description: 'Markdown is supported.',
      required: true,
    }),
  },
  outputSchema: createCommentActionOutputSchema,
  async run({ auth, propsValue }) {
    const issue_number = propsValue.issue_number;
    const { owner, repo } = propsValue.repository!;

    const response = await githubApiCall({
      auth,
      method: HttpMethod.POST,
      resourceUri: `/repos/${owner}/${repo}/issues/${issue_number}/comments`,
      body: {
        body: propsValue.comment,
      },
    });

    return response;
  },
});
