import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sardisAuth } from '../auth';
import { sardisCommon, sardisApiCall } from '../common';

export const listTransactionsAction = createAction({
  name: 'list_transactions',
  auth: sardisAuth,
  displayName: 'List Transactions',
  description: 'Retrieve transaction history from a Sardis wallet ledger.',
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
