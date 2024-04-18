import { githubAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import { githubCommon } from '../common';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';

export const githubUnlockIssueAction = createAction({
  auth: githubAuth,
  name: 'unlockIssue',
  displayName: 'Unlock issue',
  description: 'Unlocks the specified issue',
  props: {
    repository: githubCommon.repositoryDropdown,
    issue_number: Property.Number({
      displayName: 'Issue Number',
      description: 'The number of the issue to be unlocked',
      required: true,
    }),
  },
  async run(configValue) {
    const { issue_number } = configValue.propsValue;
    const { owner, repo } = configValue.propsValue.repository!;

    const request: HttpRequest = {
      url: `${githubCommon.baseUrl}/repos/${owner}/${repo}/issues/${issue_number}/lock`,
      method: HttpMethod.DELETE,
      queryParams: {
        owner: `${owner}`,
        repo: `${repo}`,
        issue_number: `${issue_number}`,
      },
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: configValue.auth.access_token,
      },
    };

    const response = await httpClient.sendRequest(request);

    return {
      success: response.status === 204,
    };
  },
});
