// Action: List Comments
import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { youtrackAuth } from '../../';
import { issueDropdown } from '../common';

export const listCommentsAction = createAction({
  auth: youtrackAuth,
  name: 'list_comments',
  displayName: 'List Comments',
  description: 'Lists all comments on an issue with author details and timestamps.',
  props: {
    issue: issueDropdown,
    limit: Property.Number({ displayName: 'Limit', description: 'Max comments. Default 100.', required: false, defaultValue: 100 }),
  },
  async run(context) {
    const a = context.auth as unknown as { baseUrl: string; apiToken: string };
    const limit = context.propsValue.limit ?? 100;
    const url = a.baseUrl.replace(/\/+$/, '') + '/api/issues/' + context.propsValue.issue +
      '/comments?fields=id,text,author(name,login),created,updated&$top=' + limit;
    const r = await fetch(url, {
      method: HttpMethod.GET,
      headers: { 'Accept': 'application/json', 'Authorization': 'Bearer ' + a.apiToken },
    });
    const data = await r.json() as Array<Record<string, unknown>>;
    if (!r.ok) throw new Error('Failed to list comments: ' + JSON.stringify(data));
    return (data || []).map((c) => ({
      id: c.id, text: c.text,
      author_name: (c.author as Record<string, unknown>)?.name ?? null,
      author_login: (c.author as Record<string, unknown>)?.login ?? null,
      created: c.created, updated: c.updated,
    }));
  },
  sampleData: [
    { id: '136-261', text: 'Tweaks per requirements.', author_name: 'Jane Doe', author_login: 'jane.doe', created: 1647869116494, updated: 1647869116494 },
  ],
});
