import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { youtrackAuth } from '../auth';
import { issueDropdown, ISSUE_FIELDS, flattenIssue, yesNoDropdown, yesNoFlag } from '../common';
import { youtrackClient } from '../common/client';
import { customFieldsHelper } from '../common/custom-fields';
import { updateIssueActionOutputSchema } from '../output-schemas';

export const updateIssueAction = createAction({
  auth: youtrackAuth,
  name: 'update_issue',
  classification: 'WRITE',
  outputSchema: updateIssueActionOutputSchema,
  displayName: 'Update Issue',
  description: 'Updates an existing issue - summary, description, or custom fields.',
  audience: 'both',
  aiMetadata: {
    description:
      'Update an existing issue identified by its ID, changing summary, description and/or custom fields; only the fields you provide are modified. Pass Custom Fields (JSON) as a map of field name to value, e.g. {"State":"In Progress","Assignee":"jane.doe"}, with null to clear a field; List Project Custom Fields shows names and allowed values. Set Clear Description to "yes" to blank the description. For free-text workflow commands use Apply Command instead. Idempotent: re-applying the same values leaves the issue in the same state.',
    idempotent: true,
  },
  props: {
    issue: issueDropdown,
    summary: Property.ShortText({ displayName: 'Summary', description: 'New summary. Leave empty to keep.', required: false }),
    description: Property.LongText({ displayName: 'Description', description: 'New description. Leave empty to keep.', required: false }),
    clearDescription: yesNoDropdown({
      displayName: 'Clear Description',
      description: 'Choose Yes to remove the description. Leave empty or No to keep it (or to set the Description above).',
    }),
    customFieldsJson: Property.Json({
      displayName: 'Custom Fields (JSON)',
      description:
        'Set custom fields. Simplest form, a map of field name to value:\n' +
        '{ "Priority": "Critical", "State": "In Progress", "Assignee": "jane.doe" }\n' +
        'null clears a field. The full YouTrack form also works:\n' +
        '[{ "name": "Priority", "$type": "SingleEnumIssueCustomField", "value": { "name": "Critical" } }]',
      required: false,
    }),
  },
  async run(context) {
    const auth = context.auth;
    const issue = youtrackClient.segment({ value: context.propsValue.issue, label: 'Issue' });
    const clearDescription = yesNoFlag(context.propsValue.clearDescription) === true;
    const description = context.propsValue.description;
    if (clearDescription && description !== undefined && description !== '') {
      throw new Error('Set either Description or Clear Description, not both.');
    }
    const body: Record<string, unknown> = {};
    if (context.propsValue.summary !== undefined && context.propsValue.summary !== '') body['summary'] = context.propsValue.summary;
    if (description !== undefined && description !== '') body['description'] = description;
    if (clearDescription) body['description'] = '';
    const customFields = await customFieldsHelper.resolveCustomFields({
      value: context.propsValue.customFieldsJson,
      loadFields: () => customFieldsHelper.fieldsFromIssue({ auth, issue: context.propsValue.issue }),
    });
    if (customFields) body['customFields'] = customFields;
    const response = await youtrackClient.request<unknown>({
      auth,
      method: HttpMethod.POST,
      path: `/issues/${issue}`,
      query: { fields: ISSUE_FIELDS },
      body,
      operation: 'update the issue',
    });
    return flattenIssue(youtrackClient.recordOf(response));
  },
});
