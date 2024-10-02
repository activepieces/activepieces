import { Octokit } from 'octokit';
import { githubAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import { githubCommon } from '../common';

export const githubCreateCommentOnAIssue = createAction({
  auth: githubAuth,
  name: 'createCommentOnAIssue',
  displayName: 'Create comment on a issue',
  description:
    'Adds a comment to the specified issue (also works with pull requests)',
  props: {
    repository: githubCommon.repositoryDropdown,
    issue_number: Property.Number({
      displayName: 'Issue number',
      description: 'The number of the issue to comment on',
      required: true,
    }),
    comment: Property.LongText({
      displayName: 'Comment',
      description: 'The comment to add to the issue',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const issue_number = propsValue.issue_number;
    const { owner, repo } = propsValue.repository!;

    const client = new Octokit({ auth: auth.access_token });
    return await client.rest.issues.createComment({
      owner,
      repo,
      issue_number,
      body: propsValue.comment,
    });
  },
});
