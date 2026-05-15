// Action: Add Comment
import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { youtrackAuth } from '../../';
import { issueDropdown, youtrackApiCall } from '../common';

export const addCommentAction = createAction({
  auth: youtrackAuth,
  name: 'add_comment',
  displayName: 'Add Comment',
  description: 'Adds a comment to an issue. Supports Markdown formatting.',
  props: {
    issue: issueDropdown,
    text: Property.LongText({
      displayName: 'Comment Text',
      description: 'The comment text. Use Markdown for formatting. Mention users with @username.',
      required: true,
    }),
    visibleToGroup: Property.Dropdown({
      displayName: 'Visible to Group',
      description: 'Restrict comment visibility to a group. Leave empty for everyone.',
      required: false,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) return { disabled: true, options: [], placeholder: 'Connect your account first' };
        const a = auth as unknown as { baseUrl: string; apiToken: string };
        try {
          const r = await youtrackApiCall<Array<{ id: string; name: string }>>({
            baseUrl: a.baseUrl, token: a.apiToken, method: HttpMethod.GET,
            path: '/groups', queryParams: { fields: 'id,name' },
          });
          return { disabled: false, options: [{ label: '[Visible to everyone]', value: '' }, ...r.body.map((g) => ({ label: g.name, value: g.id }))] };
        } catch { return { disabled: true, options: [], placeholder: 'Failed to load groups.' }; }
      },
    }),
  },
  async run(context) {
    const a = context.auth as unknown as { baseUrl: string; apiToken: string };
    const body: Record<string, unknown> = { text: context.propsValue.text };
    if (context.propsValue.visibleToGroup) {
      body.visibility = { '$type': 'LimitedVisibility', permittedGroups: [{ id: context.propsValue.visibleToGroup }] };
    }
    const url = a.baseUrl.replace(/\/+$/, '') + '/api/issues/' + context.propsValue.issue +
      '/comments?fields=id,text,author(name,login),created';
    const r = await fetch(url, {
      method: HttpMethod.POST,
      headers: { 'Accept': 'application/json', 'Authorization': 'Bearer ' + a.apiToken, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!r.ok) { const errText = await r.text().catch(() => String(r.status)); throw new Error('Failed to add comment: ' + errText); }
    const data = await r.json();
    return {
      id: data.id, text: data.text,
      author_name: (data.author as Record<string, unknown>)?.name ?? null,
      author_login: (data.author as Record<string, unknown>)?.login ?? null,
      created: data.created,
    };
  },
  sampleData: { id: '136-261', text: 'Fixed in latest build.', author_name: 'Jane Doe', author_login: 'jane.doe', created: 1647869116494 },
});
