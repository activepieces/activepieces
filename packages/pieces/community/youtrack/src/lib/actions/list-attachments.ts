import { createAction, Property } from '@activepieces/pieces-framework';
import { youtrackAuth } from '../auth';
import { issueDropdown } from '../common';
import { youtrackClient } from '../common/client';
import { listAttachmentsActionOutputSchema } from '../output-schemas';

export const listAttachmentsAction = createAction({
  auth: youtrackAuth,
  name: 'list_attachments',
  classification: 'SEARCH',
  outputSchema: listAttachmentsActionOutputSchema,
  displayName: 'List Attachments',
  description: 'Lists all attachments on a specific issue with metadata (name, size, type).',
  audience: 'both',
  aiMetadata: {
    description:
      'List the attachments on an issue, given its ID, with metadata (name, size, content type, author), up to Limit (default 50). Use to find attachment IDs for Download Attachment or Delete Attachment. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    issue: issueDropdown,
    limit: Property.Number({ displayName: 'Limit', description: 'Max attachments. Default 50.', required: false, defaultValue: 50 }),
  },
  async run(context) {
    const items = await youtrackClient.listUpTo({
      auth: context.auth,
      path: `/issues/${youtrackClient.segment({ value: context.propsValue.issue, label: 'Issue' })}/attachments`,
      query: { fields: 'id,name,mimeType,size,author(name,login),created' },
      limit: context.propsValue.limit,
      fallback: 50,
      operation: 'list attachments',
    });
    return items.map((att) => {
      const author = youtrackClient.recordOf(att['author']);
      return {
        id: att['id'],
        name: att['name'],
        content_type: att['mimeType'] ?? null,
        size_bytes: att['size'],
        author_name: author['name'] ?? null,
        author_login: author['login'] ?? null,
        created: att['created'],
      };
    });
  },
});
