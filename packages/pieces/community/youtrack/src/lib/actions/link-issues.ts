// Action: Link Issues
import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { youtrackAuth } from '../../';
import { issueDropdown } from '../common';

export const linkIssuesAction = createAction({
  auth: youtrackAuth,
  name: 'link_issues',
  displayName: 'Link Issues',
  description: 'Creates a relationship between two issues (e.g. "relates to", "depends on", "is duplicated by").',
  props: {
    sourceIssue: issueDropdown,
    targetIssueId: Property.ShortText({
      displayName: 'Target Issue ID',
      description: 'The readable ID of the issue to link to (e.g. "NP-92"). You can find this in the issue URL or header.',
      required: true,
    }),
    linkType: Property.StaticDropdown({
      displayName: 'Link Type',
      description: 'The type of relationship between the issues.',
      required: true,
      defaultValue: 'relates to',
      options: {
        options: [
          { label: 'Relates to', value: 'relates to' },
          { label: 'Depends on', value: 'depends on' },
          { label: 'Is duplicated by', value: 'is duplicated by' },
          { label: 'Duplicates', value: 'duplicates' },
          { label: 'Parent for', value: 'parent for' },
          { label: 'Subtask of', value: 'subtask of' },
        ],
      },
    }),
  },
  async run(context) {
    const a = context.auth as unknown as { baseUrl: string; apiToken: string };
    const body: Record<string, unknown> = {
      query: context.propsValue.linkType + ' ' + context.propsValue.targetIssueId,
      issues: [{ id: context.propsValue.sourceIssue }],
    };
    const r = await fetch(a.baseUrl.replace(/\/+$/, '') + '/api/commands', {
      method: HttpMethod.POST,
      headers: { 'Accept': 'application/json', 'Authorization': 'Bearer ' + a.apiToken, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error('Failed to link issues: ' + JSON.stringify(e)); }
    return { success: true, link_type: context.propsValue.linkType, target_issue: context.propsValue.targetIssueId };
  },
  sampleData: { success: true, link_type: 'relates to', target_issue: 'NP-92' },
});
