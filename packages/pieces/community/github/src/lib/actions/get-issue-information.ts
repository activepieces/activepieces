import { githubAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import { githubCommon } from '../common';
import {
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';

export const githubGetIssueInformation = createAction({
  auth: githubAuth,
  name: 'getIssueInformation',
  displayName: 'Get issue information',
  description: 'Grabs information from a specific issue',
  props: {
    repository: githubCommon.repositoryDropdown,
    issue_number: Property.Number({
      displayName: 'Issue Number',
      description: 'The number of the issue you want to get information from',
      required: true,
    }),
  },
  async run(configValue) {
    const issueNumber = configValue.propsValue.issue_number;
    const { owner, repo } = configValue.propsValue.repository!;
    const request: HttpRequest = {
      url: `${githubCommon.baseUrl}/repos/${owner}/${repo}/issues/${issueNumber}`,
      method: HttpMethod.GET,
      headers: {
        'X-GitHub-Api-Version': '2022-11-28',
        Authorization: `Bearer ${configValue.auth.access_token}`,
      },
    };

    const response = await httpClient.sendRequest(request);

    return {
      success: response.status === 200,
      issue: response.body,
    };
  },
});
