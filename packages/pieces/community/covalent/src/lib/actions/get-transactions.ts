import { createAction, Property } from '@activepieces/pieces-framework';
import { covalentAuth } from '../..';
import { covalentRequest } from '../common/covalent-api';
import { CHAIN_OPTIONS } from '../common/chain-dropdown';

interface Transaction {
  block_signed_at: string;
  tx_hash: string;
  from_address: string;
  to_address: string;
  value: string;
  gas_offered: number;
  gas_spent: number;
  gas_price: number;
  fees_paid: string;
  successful: boolean;
}

interface TransactionsResponse {
  address: string;
  updated_at: string;
  items: Transaction[];
  pagination: {
    has_more: boolean;
    page_number: number;
    page_size: number;
    total_count: number | null;
  };
}

export const getTransactions = createAction({
  name: 'get_transactions',
  displayName: 'Get Transactions',
  description:
    'Fetch transaction history for a wallet address across 100+ blockchains.',
  auth: covalentAuth,
  requireAuth: true,
  props: {
    wallet_address: Property.ShortText({
      displayName: 'Wallet Address',
      description: 'The wallet address to get transactions for.',
      required: true,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of transactions to return.',
      required: false,
      defaultValue: 10,
    }),
    chain_name: Property.StaticDropdown({
      displayName: 'Chain',
      description: 'The blockchain network to query.',
      required: true,
      defaultValue: 'eth-mainnet',
      options: {
        options: CHAIN_OPTIONS,
      },
    }),
  },
  async run({ auth, propsValue }) {
    const { wallet_address, limit, chain_name } = propsValue;
    const data = await covalentRequest<TransactionsResponse>(
      auth as string,
      `${chain_name}/address/${wallet_address}/transactions_v3/page/0/`,
      { limit: String(limit ?? 10) }
    );
    return {
      address: data.address,
      updated_at: data.updated_at,
      transaction_count: data.items.length,
      transactions: data.items,
      pagination: data.pagination,
    };
  },
});
