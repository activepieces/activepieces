// Action: Get Issue History
import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { youtrackAuth } from '../../';
import { issueDropdown, youtrackApiCall } from '../common';

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
    const { baseUrl, apiToken } = context.auth.props;
    const categories = (context.propsValue.categories as string[]).join(',');
    const response = await youtrackApiCall<Array<Record<string, unknown>>>({
      baseUrl,
      token: apiToken,
      method: HttpMethod.GET,
      path: '/issues/' + context.propsValue.issue + '/activities',
      queryParams: {
        categories,
        fields: 'author(name,login),timestamp,target(id,text),added(name),removed(name)',
      },
    });
    const data = response.body;
    return (data || []).map((item) => ({
      type: item['$type'],
      timestamp: item['timestamp'],
      author_name: (item['author'] as Record<string, unknown>)?.['name'] ?? null,
      author_login: (item['author'] as Record<string, unknown>)?.['login'] ?? null,
      added_values: Array.isArray(item['added'])
        ? (item['added'] as Array<Record<string, unknown>>).map((x) => x['name'] ?? JSON.stringify(x)).join(', ')
        : null,
      removed_values: Array.isArray(item['removed'])
        ? (item['removed'] as Array<Record<string, unknown>>).map((x) => x['name'] ?? JSON.stringify(x)).join(', ')
        : null,
      comment_text: (item['target'] as Record<string, unknown>)?.['text'] ?? null,
    }));
  },
});
