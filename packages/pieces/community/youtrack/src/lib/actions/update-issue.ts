// Action: Update Issue
import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { youtrackAuth } from '../../';
import { issueDropdown, ISSUE_FIELDS, flattenObject, youtrackApiCall } from '../common';

export const updateIssueAction = createAction({
  auth: youtrackAuth,
  name: 'update_issue',
  displayName: 'Update Issue',
  description: 'Updates an existing issue - summary, description, or custom fields.',
  props: {
    issue: issueDropdown,
    summary: Property.ShortText({ displayName: 'Summary', description: 'New summary. Leave empty to keep.', required: false }),
    description: Property.LongText({ displayName: 'Description', description: 'New description. Leave empty to keep.', required: false }),
    customFieldsJson: Property.Json({
      displayName: 'Custom Fields (JSON)',
      description: 'Set custom fields. Example:\n[{ "name": "Priority", "$type": "SingleEnumIssueCustomField", "value": { "name": "Critical" } }]',
      required: false,
    }),
  },
  async run(context) {
    const { baseUrl, apiToken } = context.auth.props;
    const body: Record<string, unknown> = {};
    if (context.propsValue.summary !== undefined && context.propsValue.summary !== '') body['summary'] = context.propsValue.summary;
    if (context.propsValue.description !== undefined && context.propsValue.description !== '') body['description'] = context.propsValue.description;
    if (context.propsValue.customFieldsJson) body['customFields'] = context.propsValue.customFieldsJson;
    const response = await youtrackApiCall<Record<string, unknown>>({
      baseUrl,
      token: apiToken,
      method: HttpMethod.POST,
      path: '/issues/' + context.propsValue.issue,
      queryParams: { fields: ISSUE_FIELDS },
      body,
    });
    return flattenObject(response.body);
  },
});
