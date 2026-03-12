import { createAction, Property } from '@activepieces/pieces-framework';
import { sardisAuth } from '../..';
import { sardisCommon, makeSardisClient } from '../common';

export const sardisListTransactions = createAction({
  name: 'list_transactions',
  auth: sardisAuth,
  displayName: 'List Transactions',
  description:
    'Retrieve recent transactions from the wallet ledger. Returns an append-only audit trail of all payments.',
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
    const client = makeSardisClient(context.auth.secret_text);

    return await client.ledger.listEntries({
      wallet_id: walletId,
      limit: Math.min(limit ?? 50, 500),
    });
  },
});
