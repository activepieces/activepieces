// Action: Get Issue History
import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { youtrackAuth } from '../../';
import { issueDropdown } from '../common';

export const getIssueHistoryAction = createAction({
  auth: youtrackAuth,
  name: 'get_issue_history',
  displayName: 'Get Issue History',
  description: 'Retrieves the full change history (activity log) for a specific issue.',
  props: {
    issue: issueDropdown,
    categories: Property.StaticMultiSelectDropdown({
      displayName: 'Activity Types',
      description: 'Select which types of activities to include.',
      required: true,
      defaultValue: ['CustomFieldCategory', 'CommentsCategory'],
      options: {
        options: [
          { label: 'Custom Field Changes', value: 'CustomFieldCategory' },
          { label: 'Comments', value: 'CommentsCategory' },
        ],
      },
    }),
  },
  async run(context) {
    const a = context.auth as unknown as { baseUrl: string; apiToken: string };
    const categories = (context.propsValue.categories as string[]).join(',');
    const url = a.baseUrl.replace(/\/+$/, '') + '/api/issues/' + context.propsValue.issue +
      '/activities?categories=' + categories +
      '&fields=author(name,login),timestamp,target(id,text),added(name),removed(name)';
    const r = await fetch(url, {
      method: HttpMethod.GET,
      headers: { 'Accept': 'application/json', 'Authorization': 'Bearer ' + a.apiToken },
    });
    if (!r.ok) { const errText = await r.text().catch(() => String(r.status)); throw new Error('Failed to get history: ' + errText); }
    const data = await r.json() as Array<Record<string, unknown>>;
    return (data || []).map((item) => ({
      type: item.$type,
      timestamp: item.timestamp,
      author_name: (item.author as Record<string, unknown>)?.name ?? null,
      author_login: (item.author as Record<string, unknown>)?.login ?? null,
      added_values: Array.isArray(item.added)
        ? (item.added as Array<Record<string, unknown>>).map((x) => x.name ?? JSON.stringify(x)).join(', ')
        : null,
      removed_values: Array.isArray(item.removed)
        ? (item.removed as Array<Record<string, unknown>>).map((x) => x.name ?? JSON.stringify(x)).join(', ')
        : null,
      comment_text: (item.target as Record<string, unknown>)?.text ?? null,
    }));
  },
  sampleData: [
    { type: 'CustomFieldActivityItem', timestamp: 1644916724088, author_name: 'Jane Doe', author_login: 'jane.doe',
      added_values: 'Critical', removed_values: 'Major', comment_text: null },
  ],
});
