import { githubAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import { githubApiCall, githubCommon } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const githubCreatePullRequestReviewCommentAction = createAction({
  auth: githubAuth,
  name: 'github_create_pull_request_review_comment',
  displayName: 'Create Pull Request Review Comment',
  description:
    'Creates a review comment on a pull request in a GitHub repository',
  props: {
    repository: githubCommon.repositoryDropdown,
    pull_number: Property.Number({
      displayName: 'Pull Request Number',
      description: 'The number of the pull request',
      required: true,
    }),
    commit_id: Property.ShortText({
      displayName: 'Commit SHA',
      description: 'The SHA of the commit to comment on',
      required: true,
    }),
    path: Property.ShortText({
      displayName: 'File Path',
      description: 'The relative path to the file to comment on',
      required: true,
    }),
    body: Property.LongText({
      displayName: 'Comment Body',
      description: 'The content of the review comment',
      required: true,
    }),
    position: Property.Number({
      displayName: 'Position',
      description:
        'The position in the diff where the comment should be placed',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { pull_number, commit_id, path, body, position } = propsValue;
    const { owner, repo } = propsValue.repository!;

    const response = await githubApiCall({
      accessToken: auth.access_token,
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
