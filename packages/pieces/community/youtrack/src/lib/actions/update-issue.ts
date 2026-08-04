// Action: Update Issue
import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { youtrackAuth } from '../auth';
import { issueDropdown, ISSUE_FIELDS, flattenIssue, normalizeCustomFields, youtrackApiCall } from '../common';
import { updateIssueActionOutputSchema } from '../output-schemas';

export const updateIssueAction = createAction({
  auth: youtrackAuth,
  name: 'update_issue',
  outputSchema: updateIssueActionOutputSchema,
  displayName: 'Update Issue',
  description: 'Updates an existing issue - summary, description, or custom fields.',
  audience: 'both',
  aiMetadata: { description: 'Update an existing issue identified by its ID, changing summary, description, and/or custom fields (priority, assignee, etc.); only the fields you provide are modified. Use to edit issue content or set field values. Idempotent: re-applying the same values leaves the issue in the same state.', idempotent: true },
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
    const customFields = normalizeCustomFields(context.propsValue.customFieldsJson);
    if (customFields) body['customFields'] = customFields;
    const response = await youtrackApiCall<Record<string, unknown>>({
      baseUrl,
      token: apiToken,
      method: HttpMethod.POST,
      path: '/issues/' + context.propsValue.issue,
      queryParams: { fields: ISSUE_FIELDS },
      body,
    });
    return flattenIssue(response.body);
  },
});
