import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { youtrackAuth } from '../../';
import { issueDropdown, youtrackApiCall } from '../common';

export const addCommentAction = createAction({
  auth: youtrackAuth,
  name: 'add_comment',
  displayName: 'Add Comment',
  description: 'Adds a comment to an issue. Supports Markdown formatting.',
  audience: 'both',
  aiMetadata: { description: 'Post a comment on an issue, given the issue ID and Markdown text; optionally restrict visibility to a specific group. Use to add a note or reply on an issue. Not idempotent: each call appends a new comment.', idempotent: false },
  props: {
    issue: issueDropdown,
    text: Property.LongText({
      displayName: 'Comment Text',
      description: 'The comment text. Use Markdown for formatting. Mention users with @username.',
      required: true,
    }),
    visibleToGroup: Property.Dropdown({
      auth:youtrackAuth,
      displayName: 'Visible to Group',
      description: 'Restrict comment visibility to a group. Leave empty for everyone.',
      required: false,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) return { disabled: true, options: [], placeholder: 'Connect your account first' };
        const { baseUrl, apiToken } = auth as unknown as { baseUrl: string; apiToken: string };
        try {
          const response = await youtrackApiCall<Array<{ id: string; name: string }>>({
            baseUrl, token: apiToken, method: HttpMethod.GET,
            path: '/groups', queryParams: { fields: 'id,name' },
          });
          return { disabled: false, options: [{ label: '[Visible to everyone]', value: '' }, ...response.body.map((g) => ({ label: g.name, value: g.id }))] };
        } catch { return { disabled: true, options: [], placeholder: 'Failed to load groups.' }; }
      },
    }),
  },
  async run(context) {
    const {baseUrl,apiToken} = context.auth.props
    const body: Record<string, unknown> = { text: context.propsValue.text };
    if (context.propsValue.visibleToGroup) {
      body['visibility'] = { '$type': 'LimitedVisibility', permittedGroups: [{ id: context.propsValue.visibleToGroup }] };
    }
    const response = await youtrackApiCall<Record<string, unknown>>({
      baseUrl: baseUrl,
      token: apiToken,
      method: HttpMethod.POST,
      path: '/issues/' + context.propsValue.issue + '/comments',
      queryParams: { fields: 'id,text,author(name,login),created' },
      body,
    });
    return {
      id: response.body['id'], text: response.body['text'],
      author_name: (response.body['author'] as Record<string, unknown>)?.['name'] ?? null,
      author_login: (response.body['author'] as Record<string, unknown>)?.['login'] ?? null,
      created: response.body['created'],
    };
  },
});
