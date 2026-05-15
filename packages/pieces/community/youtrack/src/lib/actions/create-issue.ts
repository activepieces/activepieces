// Action: Create Issue
import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { youtrackAuth } from '../../';
import { projectDropdown, ISSUE_FIELDS, flattenObject } from '../common';

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
    const a = context.auth as unknown as { baseUrl: string; apiToken: string };
    const body: Record<string, unknown> = {
      project: { id: context.propsValue.project },
      summary: context.propsValue.summary,
    };
    if (context.propsValue.description) body.description = context.propsValue.description;
    if (context.propsValue.customFieldsJson) body.customFields = context.propsValue.customFieldsJson;

    const url = a.baseUrl.replace(/\/+$/, '') + '/api/issues?fields=' + encodeURIComponent(ISSUE_FIELDS);
    const r = await fetch(url, {
      method: HttpMethod.POST,
      headers: { 'Accept': 'application/json', 'Authorization': 'Bearer ' + a.apiToken, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!r.ok) { const errText = await r.text().catch(() => String(r.status)); throw new Error('Failed to create issue: ' + errText); }
    const data = await r.json();
    return flattenObject(data);
  },
  sampleData: {
    idReadable: 'SP-42', summary: 'Fix login page crash', description: 'Users report crashes with special characters.',
    project_name: 'Sample Project', project_shortName: 'SP', reporter_name: 'Jane Doe', reporter_login: 'jane.doe',
    created: 1644916724088, updated: 1644916724088,
  },
});
