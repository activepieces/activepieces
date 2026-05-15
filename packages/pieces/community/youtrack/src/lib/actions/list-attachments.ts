// Action: List Attachments
import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { youtrackAuth } from '../../';
import { issueDropdown } from '../common';

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
    const a = context.auth as unknown as { baseUrl: string; apiToken: string };
    const limit = context.propsValue.limit ?? 50;
    const url = a.baseUrl.replace(/\/+$/, '') + '/api/issues/' + context.propsValue.issue +
      '/attachments?fields=id,name,contentType,size,author(name,login),created&$top=' + limit;
    const r = await fetch(url, {
      method: HttpMethod.GET,
      headers: { 'Accept': 'application/json', 'Authorization': 'Bearer ' + a.apiToken },
    });
    if (!r.ok) { const errText = await r.text().catch(() => String(r.status)); throw new Error('Failed to list attachments: ' + errText); }
    const data = await r.json() as Array<Record<string, unknown>>;
    return (data || []).map((att) => ({
      id: att.id,
      name: att.name,
      content_type: att.contentType,
      size_bytes: att.size,
      author_name: (att.author as Record<string, unknown>)?.name ?? null,
      author_login: (att.author as Record<string, unknown>)?.login ?? null,
      created: att.created,
    }));
  },
  sampleData: [
    { id: '134-31', name: 'screenshot.png', content_type: 'image/png', size_bytes: 24576, author_name: 'Jane Doe', author_login: 'jane.doe', created: 1644916724088 },
  ],
});
