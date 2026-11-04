import { createAction, Property } from '@activepieces/pieces-framework';
import { helpScoutApi } from '../../common/api';
import { helpScoutAuth } from '../../common/auth';
import { helpScoutOutputSchemas } from '../../common/output-schemas';

export const listMailboxes = createAction({
  auth: helpScoutAuth,
  name: 'list_mailboxes',
  classification: 'READ',
  displayName: 'List Mailboxes',
  description: 'Lists the mailboxes (inboxes) the connected user can access.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists Help Scout mailboxes (inboxes) the connected user can access, with id, name and email. Use to get the mailboxId needed by Create Conversation, Search Conversations or Update Conversation. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: helpScoutOutputSchemas['listMailboxes'],
  props: {
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of items to return (default 50, max 500). Help Scout pages are fetched until this is reached.',
      required: false,
      defaultValue: 50,
    }),
  },
  async run({ auth, propsValue }) {
    const { items, truncated } = await helpScoutApi.fetchPaged({
      auth,
      path: '/mailboxes',
      embedKey: 'mailboxes',
      limit: propsValue.limit ?? 50,
    });
    return { mailboxes: items, count: items.length, truncated };
  },
});
