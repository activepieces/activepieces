import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { youtrackAuth } from '../auth';
import { projectDropdown, ISSUE_FIELDS, flattenIssue, resolveProject } from '../common';
import { youtrackClient } from '../common/client';
import { customFieldsHelper } from '../common/custom-fields';
import { createIssueActionOutputSchema } from '../output-schemas';

export const createIssueAction = createAction({
  auth: youtrackAuth,
  name: 'create_issue',
  classification: 'WRITE',
  outputSchema: createIssueActionOutputSchema,
  displayName: 'Create Issue',
  description: 'Creates a new issue in a YouTrack project.',
  audience: 'both',
  aiMetadata: {
    description:
      'Create a new issue in a YouTrack project, given the project (ID like "0-5" or short name like "APT") and a summary; optionally a Markdown description and custom fields. Pass Custom Fields (JSON) as a simple map of field name to value, e.g. {"Priority":"Critical","Assignee":"jane.doe","Estimation":"2h","Due Date":"2026-12-01"}; call List Project Custom Fields first to learn the field names and allowed values, and Find Users for logins. Without project admin rights the field types are read from one existing issue; if a field is missing, pass it as an entry with $type. Not idempotent: each call creates a distinct issue.',
    idempotent: false,
  },
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
      description:
        'Set custom field values on creation. Simplest form, a map of field name to value:\n' +
        '{ "Priority": "Critical", "Assignee": "jane.doe", "Estimation": "2h", "Due Date": "2026-12-01" }\n' +
        'Multi-value fields take a list, and null clears a field. The full YouTrack form also works:\n' +
        '[{ "name": "Priority", "$type": "SingleEnumIssueCustomField", "value": { "name": "Critical" } }]\n' +
        'Use List Project Custom Fields to see the field names and allowed values. If a field is missing, pass it as an entry with $type.',
      required: false,
    }),
  },
  async run(context) {
    const auth = context.auth;
    const projectValue = youtrackClient.optionalText(context.propsValue.project) ?? '';
    const projectId = youtrackClient.isDatabaseId(projectValue)
      ? projectValue
      : (await resolveProject({ auth, value: projectValue })).id;
    const body: Record<string, unknown> = {
      project: { id: projectId },
      summary: context.propsValue.summary,
    };
    if (context.propsValue.description) body['description'] = context.propsValue.description;
    const customFields = await customFieldsHelper.resolveCustomFields({
      value: context.propsValue.customFieldsJson,
      loadFields: async () => (await customFieldsHelper.fieldsForProject({ auth, projectId, withValues: false })).fields,
    });
    if (customFields) body['customFields'] = customFields;
    const response = await youtrackClient.request<unknown>({
      auth,
      method: HttpMethod.POST,
      path: '/issues',
      query: { fields: ISSUE_FIELDS },
      body,
      operation: 'create the issue',
    });
    return flattenIssue(youtrackClient.recordOf(response));
  },
});
