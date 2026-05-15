// Action: Update Issue
import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { youtrackAuth } from '../../';
import { issueDropdown, ISSUE_FIELDS, flattenObject } from '../common';

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
    const a = context.auth as unknown as { baseUrl: string; apiToken: string };
    const body: Record<string, unknown> = {};
    if (context.propsValue.summary !== undefined && context.propsValue.summary !== '') body.summary = context.propsValue.summary;
    if (context.propsValue.description !== undefined && context.propsValue.description !== '') body.description = context.propsValue.description;
    if (context.propsValue.customFieldsJson) body.customFields = context.propsValue.customFieldsJson;
    const url = a.baseUrl.replace(/\/+$/, '') + '/api/issues/' + context.propsValue.issue + '?fields=' + encodeURIComponent(ISSUE_FIELDS);
    const r = await fetch(url, {
      method: HttpMethod.POST,
      headers: { 'Accept': 'application/json', 'Authorization': 'Bearer ' + a.apiToken, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!r.ok) { const errText = await r.text().catch(() => String(r.status)); throw new Error('Failed: ' + errText); }
    const data = await r.json();
    return flattenObject(data);
  },
  sampleData: { idReadable: 'SP-42', summary: 'Fixed login page crash', project_name: 'Sample Project', updated: 1648110830229 },
});
