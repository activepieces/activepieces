import { createAction, Property } from '@activepieces/pieces-framework';
import { linkupAuth, linkupGet } from '../common';

export const listAccounts = createAction({
  auth: linkupAuth,
  name: 'list_accounts',
  displayName: 'List Accounts',
  description: 'List all connected LinkedIn accounts linked to your API key. Free (0 credits). Use the returned account_id in other actions.',
  audience: 'both',
  aiMetadata: { description: 'Lists the LinkedIn accounts connected to this LinkupAPI key, paged by limit and offset. Call this first to obtain the account ID that every other LinkupAPI action and trigger requires; prefer Get Account Details when the ID is already known. Read-only and idempotent.', idempotent: true },
  props: {
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Max accounts to return per page (1-500)',
      required: false,
      defaultValue: 50,
    }),
    offset: Property.Number({
      displayName: 'Offset',
      description: 'Number of accounts to skip (for pagination)',
      required: false,
      defaultValue: 0,
    }),
  },
  async run(context) {
    const { limit, offset } = context.propsValue;
    return linkupGet(context.auth.secret_text, '/accounts', {
      limit: String(limit ?? 50),
      offset: String(offset ?? 0),
    });
  },
});
