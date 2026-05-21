import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { youtrackAuth } from '../../';
import { issueDropdown, youtrackApiCall } from '../common';

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
    const { baseUrl, apiToken } = context.auth.props;
    const limit = context.propsValue.limit ?? 100;
    const response = await youtrackApiCall<Array<Record<string, unknown>>>({
      baseUrl,
      token: apiToken,
      method: HttpMethod.GET,
      path: '/issues/' + context.propsValue.issue + '/comments',
      queryParams: { fields: 'id,text,author(name,login),created,updated', '$top': String(limit) },
    });
    const data = response.body;
    return (data || []).map((c) => ({
      id: c['id'], text: c['text'],
      author_name: (c['author'] as Record<string, unknown>)?.['name'] ?? null,
      author_login: (c['author'] as Record<string, unknown>)?.['login'] ?? null,
      created: c['created'], updated: c['updated'],
    }));
  },
});
