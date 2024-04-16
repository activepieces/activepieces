import { githubAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import { githubCommon } from '../common';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';

export const githubLockIssueAction = createAction({
  auth: githubAuth,
  name: 'lockIssue',
  displayName: 'Lock issue',
  description: 'Locks the specified issue',
  props: {
    repository: githubCommon.repositoryDropdown,
    issue_number: Property.Number({
      displayName: 'Issue Number',
      description: 'The number of the issue to be locked',
      required: true,
    }),
    lock_reason: Property.Dropdown({
      displayName: 'Lock Reason',
      description: 'The reason for locking the issue',
      required: false,
      refreshers: [],
      options: async () => {
        return {
          options: [
            { value: 'off-topic', label: 'Off-topic' },
            { value: 'too heated', label: 'Too heated' },
            { value: 'resolved', label: 'Resolved' },
            { value: 'spam', label: 'Spam' },
          ],
        };
      },
    }),
  },
  async run(configValue) {
    const { issue_number } = configValue.propsValue;
    const { owner, repo } = configValue.propsValue.repository!;

    const request: HttpRequest = {
      url: `${githubCommon.baseUrl}/repos/${owner}/${repo}/issues/${issue_number}/lock`,
      method: HttpMethod.PUT,
      queryParams: {
        owner: `${owner}`,
        repo: `${repo}`,
        issue_number: `${issue_number}`,
      },
      body: {
        lock_reason: `${configValue.propsValue.lock_reason}`,
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
