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
  description: 'Create Issue',
  sampleData: {},
  props: {
    repository: githubCommon.repositoryDropdown,
    title: Property.ShortText({
      displayName: 'Title',
      description: 'The title of an issue',
      required: true,
    }),
    assignee: githubCommon.assigneeDropDown,
  },
  async run(configValue) {
    const title = configValue.propsValue['title'];
    const { owner, repo } = configValue.propsValue['repository']!;
    const assignee = configValue.propsValue['assignee']!;
    const requestBody: CreateIssueRequestBody = {
      title: title,
      assignees: assignee,
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
  assignees: string[];
};
