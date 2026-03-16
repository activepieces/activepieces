import { createAction, Property } from '@activepieces/pieces-framework';
import { heliusAuth } from '../..';
import { heliusRestRequest } from '../common/helius-api';

type TransactionResponse = Record<string, unknown>[];

export const getWalletTransactions = createAction({
  name: 'get_wallet_transactions',
  displayName: 'Get Wallet Transactions',
  description:
    'Get recent transaction history for a Solana wallet.',
  auth: heliusAuth,
  requireAuth: true,
  props: {
    wallet_address: Property.ShortText({
      displayName: 'Wallet Address',
      description: 'The Solana wallet address to get transactions for.',
      required: true,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of transactions to return.',
      required: false,
      defaultValue: 10,
    }),
  },
  async run({ auth, propsValue }) {
    const limit = propsValue.limit ?? 10;
    const data = await heliusRestRequest<TransactionResponse>(
      auth as string,
      `/addresses/${propsValue.wallet_address}/transactions?limit=${limit}`
    );

    return {
      transaction_count: data.length,
      transactions: data,
    };
  },
});
