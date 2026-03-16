import { createAction, Property } from '@activepieces/pieces-framework';
import { moralisAuth } from '../..';
import { moralisRequest } from '../common/moralis-api';

interface TransactionsResult {
  result: {
    hash: string;
    from_address: string;
    to_address: string;
    value: string;
    gas: string;
    gas_price: string;
    block_number: string;
    block_timestamp: string;
  }[];
}

export const getWalletTransactions = createAction({
  name: 'get_wallet_transactions',
  displayName: 'Get Wallet Transactions',
  description:
    'Get recent transaction history for an EVM wallet address.',
  auth: moralisAuth,
  requireAuth: true,
  props: {
    address: Property.ShortText({
      displayName: 'Wallet Address',
      description: 'The EVM wallet address to get transactions for.',
      required: true,
    }),
    chain: Property.StaticDropdown({
      displayName: 'Chain',
      description: 'The blockchain network to query.',
      required: true,
      defaultValue: 'eth',
      options: {
        options: [
          { label: 'Ethereum', value: 'eth' },
          { label: 'BNB Chain', value: 'bsc' },
          { label: 'Polygon', value: 'polygon' },
          { label: 'Avalanche', value: 'avalanche' },
        ],
      },
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of transactions to return.',
      required: false,
      defaultValue: 10,
    }),
  },
  async run({ auth, propsValue }) {
    const data = await moralisRequest<TransactionsResult>(
      auth as string,
      `/${propsValue.address}`,
      {
        chain: propsValue.chain,
        limit: String(propsValue.limit ?? 10),
      }
    );

    return {
      address: propsValue.address,
      chain: propsValue.chain,
      count: data.result.length,
      transactions: data.result,
    };
  },
});
