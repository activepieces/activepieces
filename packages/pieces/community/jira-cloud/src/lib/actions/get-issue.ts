import { createAction, Property } from '@activepieces/pieces-framework';
import { jiraCloudAuth } from '../../auth';
import { HttpMethod, QueryParams } from '@activepieces/pieces-common';
import { sendJiraRequest } from '../common';
import { getIssueIdDropdown, getProjectIdDropdown } from '../common/props';

export const getIssueAction = createAction({
  auth: jiraCloudAuth,
  name: 'get_issue',
  displayName: 'Get Issue',
  description: 'Get issue data.',
  props: {
    projectId: getProjectIdDropdown(),
    issueId: getIssueIdDropdown({ refreshers: ['projectId'] }),
    expand: Property.StaticMultiSelectDropdown({
      displayName: 'Expand',
      description:
        'Include additional information about the issue in the response',
      required: false,
      options: {
        options: [
          {
            label: 'Rendered Fields',
            value: 'renderedFields',
          },
          {
            label: 'Names',
            value: 'names',
          },
          {
            label: 'Schema',
            value: 'schema',
          },
          {
            label: 'Transitions',
            value: 'transitions',
          },
          {
            label: 'Edit Meta',
            value: 'editmeta',
          },
          {
            label: 'Changelog',
            value: 'changelog',
          },
        ],
      },
    }),
  },
  async run(context) {
    const { issueId, expand } = context.propsValue;

    const queryParams = {} as QueryParams;
    if (expand) {
      queryParams['expand'] = (expand as string[]).join(',');
    }

    // https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issues/#api-rest-api-3-issue-issueidorkey-get
    const response = await sendJiraRequest({
      method: HttpMethod.GET,
      url: `issue/${issueId}`,
      auth: context.auth,
      queryParams: queryParams,
    });
    return response.body;
  },
});
