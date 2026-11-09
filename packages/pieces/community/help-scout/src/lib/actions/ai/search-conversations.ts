import { createAction, Property } from '@activepieces/pieces-framework';
import { helpScoutApi } from '../../common/api';
import { helpScoutAuth } from '../../common/auth';
import { helpScoutOutputSchemas } from '../../common/output-schemas';

export const searchConversations = createAction({
  auth: helpScoutAuth,
  name: 'search_conversations',
  classification: 'SEARCH',
  displayName: 'Search Conversations',
  description: 'Lists conversations matching filters.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists Help Scout conversations matching optional filters (mailbox, status, tag, assigned user, modified since, or Help Scout search query syntax such as email:"a@b.com" or subject:"refund"), newest activity first. Status defaults to all. Returns up to limit items and truncated=true when more exist. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: helpScoutOutputSchemas['searchConversations'],
  props: {
    mailboxId: Property.Number({ displayName: 'Mailbox ID', required: false }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      required: false,
      defaultValue: 'all',
      options: {
        disabled: false,
        options: [
          { label: 'All', value: 'all' },
          { label: 'Active', value: 'active' },
          { label: 'Open', value: 'open' },
          { label: 'Pending', value: 'pending' },
          { label: 'Closed', value: 'closed' },
          { label: 'Spam', value: 'spam' },
        ],
      },
    }),
    tag: Property.ShortText({ displayName: 'Tag', description: 'Comma-separated tag names; matches conversations with any of them.', required: false }),
    assignedTo: Property.Number({ displayName: 'Assigned To User ID', required: false }),
    query: Property.ShortText({ displayName: 'Search Query', description: 'Help Scout search syntax, for example (email:"jane@example.com").', required: false }),
    modifiedSince: Property.ShortText({ displayName: 'Modified Since', description: 'ISO 8601 UTC timestamp, for example 2026-01-31T00:00:00Z.', required: false }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of items to return (default 50, max 500). Help Scout pages are fetched until this is reached.',
      required: false,
      defaultValue: 50,
    }),
  },
  async run({ auth, propsValue }) {
    const queryParams: Record<string, string> = {
      status: propsValue.status || 'all',
      sortField: 'modifiedAt',
      sortOrder: 'desc',
    };
    if (propsValue.mailboxId !== undefined && propsValue.mailboxId !== null) queryParams['mailbox'] = String(propsValue.mailboxId);
    if (propsValue.tag) queryParams['tag'] = propsValue.tag;
    if (propsValue.assignedTo !== undefined && propsValue.assignedTo !== null) queryParams['assigned_to'] = String(propsValue.assignedTo);
    if (propsValue.query) queryParams['query'] = propsValue.query;
    if (propsValue.modifiedSince) queryParams['modifiedSince'] = propsValue.modifiedSince;
    const { items, truncated } = await helpScoutApi.fetchPaged({
      auth,
      path: '/conversations',
      embedKey: 'conversations',
      queryParams,
      limit: propsValue.limit ?? 50,
    });
    return { conversations: items, count: items.length, truncated };
  },
});
