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
    repo_owner: Property.ShortText({
      displayName: 'Repository Owner',
      description: 'The owner of the repository (not case sensitive)',
      required: true,
    }),
    repo_name: Property.ShortText({
      displayName: 'Repository Name',
      description: 'The name of the repository (not case sensitive)',
      required: true,
    }),
    issue_number: Property.Number({
      displayName: 'Issue Number',
      description: 'The number of the issue you want to get information from',
      required: true,
    }),
  },
  async run(configValue) {
    const request: HttpRequest = {
      url: `${githubCommon.baseUrl}/repos/${configValue.propsValue.repo_owner}/${configValue.propsValue.repo_name}/issues/${configValue.propsValue.issue_number}`,
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
