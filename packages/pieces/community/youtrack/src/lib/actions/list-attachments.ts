import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { youtrackAuth } from '../../';
import { issueDropdown, youtrackApiCall } from '../common';

export const listAttachmentsAction = createAction({
  auth: youtrackAuth,
  name: 'list_attachments',
  displayName: 'List Attachments',
  description: 'Lists all attachments on a specific issue with metadata (name, size, type).',
  props: {
    issue: issueDropdown,
    limit: Property.Number({ displayName: 'Limit', description: 'Max attachments. Default 50.', required: false, defaultValue: 50 }),
  },
  async run(context) {
    const { baseUrl, apiToken } = context.auth.props;
    const limit = context.propsValue.limit ?? 50;
    const response = await youtrackApiCall<Array<Record<string, unknown>>>({
      baseUrl,
      token: apiToken,
      method: HttpMethod.GET,
      path: '/issues/' + context.propsValue.issue + '/attachments',
      queryParams: { fields: 'id,name,contentType,size,author(name,login),created', '$top': String(limit) },
    });
    const data = response.body;
    return (data || []).map((att) => ({
      id: att['id'],
      name: att['name'],
      content_type: att['contentType'],
      size_bytes: att['size'],
      author_name: (att['author'] as Record<string, unknown>)?.['name'] ?? null,
      author_login: (att['author'] as Record<string, unknown>)?.['login'] ?? null,
      created: att['created'],
    }));
  },
});
