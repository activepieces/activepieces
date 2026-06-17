import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sardisAuth } from '../auth';
import { sardisCommon, sardisApiCall } from '../common';

export const listTransactionsAction = createAction({
  name: 'list_transactions',
  auth: sardisAuth,
  displayName: 'List Transactions',
  description: 'Retrieve transaction history from a Sardis wallet ledger.',
  audience: 'both',
  aiMetadata: {
    description:
      'Retrieves recent ledger entries (transaction history) for a Sardis wallet. Use it to audit past payments or confirm whether a transfer was recorded. Read-only and idempotent. Requires the wallet ID; limit is optional and defaults to 50 (capped at 500).',
    idempotent: true,
  },
  props: {
    walletId: sardisCommon.walletId,
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of transactions to return (default: 50)',
      required: false,
      defaultValue: 50,
    }),
  },
  async run(context) {
    const { walletId, limit } = context.propsValue;
    return sardisApiCall(
      context.auth.secret_text,
      HttpMethod.GET,
      '/api/v2/ledger/entries',
      undefined,
      {
        wallet_id: walletId,
        limit: String(Math.min(limit ?? 50, 500)),
      },
    );
  },
});
