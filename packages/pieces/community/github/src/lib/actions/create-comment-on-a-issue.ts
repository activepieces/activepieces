import { githubAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import { githubCommon } from '../common';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';

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
  async run(configValue) {
    const issueNumber = configValue.propsValue.issue_number;
    const { owner, repo } = configValue.propsValue.repository!;

    const request: HttpRequest = {
      url: `${githubCommon.baseUrl}/repos/${owner}/${repo}/issues/${issueNumber}/comments`,
      method: HttpMethod.POST,
      body: {
        body: configValue.propsValue.comment,
      },
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: configValue.auth.access_token,
      },
    };

    const response = await httpClient.sendRequest(request);

    return {
      success: response.status === 201,
      comment: response.body,
    };
  },
});
