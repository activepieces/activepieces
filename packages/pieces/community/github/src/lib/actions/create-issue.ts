import { createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpRequest,
  HttpMethod,
  AuthenticationType,
  httpClient,
} from '@activepieces/pieces-common';
import { githubAuth } from '../../';
import { githubCommon } from '../common';

export const githubCreateIssueAction = createAction({
  auth: githubAuth,
  name: 'github_create_issue',
  displayName: 'Create Issue',
  description: 'Create Issue in GitHub Repository',
  props: {
    repository: githubCommon.repositoryDropdown,
    title: Property.ShortText({
      displayName: 'Title',
      description: 'The title of the issue',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'The description of the issue',
      required: false,
    }),
    labels: githubCommon.labelDropDown(),
    assignees: githubCommon.assigneeDropDown(),
  },
  async run(configValue) {
    const { title, assignees, labels, description } = configValue.propsValue;
    const { owner, repo } = configValue.propsValue['repository']!;

    const requestBody: CreateIssueRequestBody = {
      title: title,
      body: description,
      labels: labels,
      assignees: assignees,
    };

    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `${githubCommon.baseUrl}/repos/${owner}/${repo}/issues`,
      body: requestBody,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: configValue.auth.access_token,
      },
      queryParams: {},
    };
    return await httpClient.sendRequest(request);
  },
});

type CreateIssueRequestBody = {
  title: string;
  body?: string;
  labels?: string[];
  assignees?: string[];
};
