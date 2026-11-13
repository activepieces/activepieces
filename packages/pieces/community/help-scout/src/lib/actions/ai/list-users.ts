import { createAction, Property } from '@activepieces/pieces-framework';
import { helpScoutApi } from '../../common/api';
import { helpScoutAuth } from '../../common/auth';
import { helpScoutOutputSchemas } from '../../common/output-schemas';

export const listUsers = createAction({
  auth: helpScoutAuth,
  name: 'list_users',
  classification: 'READ',
  displayName: 'List Users',
  description: 'Lists teammates (users) in the account.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists Help Scout users (teammates/agents, not customers) with id, name, email and role, optionally only those with access to one mailbox. Use to find the user ID for assigning or attributing replies. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: helpScoutOutputSchemas['listUsers'],
  props: {
    mailboxId: Property.Number({ displayName: 'Mailbox ID', description: 'Only users with access to this mailbox.', required: false }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of items to return (default 50, max 500). Help Scout pages are fetched until this is reached.',
      required: false,
      defaultValue: 50,
    }),
  },
  async run({ auth, propsValue }) {
    const queryParams: Record<string, string> = {};
    if (propsValue.mailboxId !== undefined && propsValue.mailboxId !== null) queryParams['mailbox'] = String(propsValue.mailboxId);
    const { items, truncated } = await helpScoutApi.fetchPaged({
      auth,
      path: '/users',
      embedKey: 'users',
      queryParams,
      limit: propsValue.limit ?? 50,
    });
    return { users: items, count: items.length, truncated };
  },
});
