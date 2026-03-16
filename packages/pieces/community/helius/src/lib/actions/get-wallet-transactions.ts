import { createAction, Property } from '@activepieces/pieces-framework';
import { heliusAuth } from '../..';
import { heliusRestRequest } from '../common/helius-api';

interface EnrichedTransaction {
  signature: string;
  timestamp: number;
  fee: number;
  type: string;
  source: string;
  description: string;
  nativeTransfers: {
    fromUserAccount: string;
    toUserAccount: string;
    amount: number;
  }[];
  tokenTransfers: {
    fromUserAccount: string;
    toUserAccount: string;
    mint: string;
    tokenAmount: number;
  }[];
}

export const getWalletTransactions = createAction({
  name: 'get_wallet_transactions',
  displayName: 'Get Wallet Transactions',
  description:
    'Get enriched transaction history for a Solana wallet address.',
  auth: heliusAuth,
  requireAuth: true,
  props: {
    address: Property.ShortText({
      displayName: 'Wallet Address',
      description: 'The Solana wallet address to get transactions for.',
      required: true,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description:
        'Maximum number of transactions to return (max 100).',
      required: false,
      defaultValue: 10,
    }),
    before: Property.ShortText({
      displayName: 'Before (Signature)',
      description:
        'Transaction signature to paginate before. Leave empty for most recent.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const limit = Math.min(propsValue.limit ?? 10, 100);
    let path = `/addresses/${propsValue.address}/transactions?limit=${limit}`;
    if (propsValue.before) {
      path += `&before=${propsValue.before}`;
    }

    const data = await heliusRestRequest<EnrichedTransaction[]>(
      auth as string,
      path
    );

    return {
      transaction_count: data.length,
      transactions: data,
    };
  },
});
