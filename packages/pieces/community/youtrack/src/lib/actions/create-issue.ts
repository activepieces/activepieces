// Action: Create Issue
import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { youtrackAuth } from '../../';
import { projectDropdown, ISSUE_FIELDS, flattenObject, youtrackApiCall } from '../common';

export const createIssueAction = createAction({
  auth: youtrackAuth,
  name: 'create_issue',
  displayName: 'Create Issue',
  description: 'Creates a new issue in a YouTrack project.',
  props: {
    project: projectDropdown,
    summary: Property.ShortText({
      displayName: 'Summary',
      description: 'A short, one-line title for the issue.',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Detailed description. Supports Markdown.',
      required: false,
    }),
    customFieldsJson: Property.Json({
      displayName: 'Custom Fields (JSON)',
      description: 'Set custom field values on creation. Example:\n' +
        '[\n' +
        '  { "name": "Priority", "$type": "SingleEnumIssueCustomField", "value": { "name": "Critical" } },\n' +
        '  { "name": "Assignee", "$type": "SingleUserIssueCustomField", "value": { "login": "jane.doe" } }\n' +
        ']',
      required: false,
    }),
  },
  async run(context) {
    const { baseUrl, apiToken } = context.auth.props;
    const body: Record<string, unknown> = {
      project: { id: context.propsValue.project },
      summary: context.propsValue.summary,
    };
    if (context.propsValue.description) body['description'] = context.propsValue.description;
    if (context.propsValue.customFieldsJson) body['customFields'] = context.propsValue.customFieldsJson;

    const response = await youtrackApiCall<Record<string, unknown>>({
      baseUrl,
      token: apiToken,
      method: HttpMethod.POST,
      path: '/issues',
      queryParams: { fields: ISSUE_FIELDS },
      body,
    });
    return flattenObject(response.body);
  },
});
