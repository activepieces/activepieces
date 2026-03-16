import { createAction, Property } from '@activepieces/pieces-framework';
import { zerionAuth } from '../auth';
import { getWalletTransactions } from '../zerion-api';

export const getWalletTransactionsAction = createAction({
  auth: zerionAuth,
  name: 'get_wallet_transactions',
  displayName: 'Get Wallet Transactions',
  description: 'Get transaction history for a wallet address.',
  props: {
    walletAddress: Property.ShortText({
      displayName: 'Wallet Address',
      description: 'The Ethereum wallet address (0x...) or ENS name.',
      required: true,
    }),
    currency: Property.StaticDropdown({
      displayName: 'Currency',
      description: 'The currency to display values in.',
      required: false,
      defaultValue: 'usd',
      options: {
        options: [
          { label: 'USD', value: 'usd' },
          { label: 'EUR', value: 'eur' },
          { label: 'GBP', value: 'gbp' },
          { label: 'BTC', value: 'btc' },
          { label: 'ETH', value: 'eth' },
        ],
      },
    }),
    pageSize: Property.Number({
      displayName: 'Page Size',
      description: 'Number of transactions to return (max 100).',
      required: false,
      defaultValue: 25,
    }),
  },
  async run(context) {
    const { walletAddress, currency, pageSize } = context.propsValue;
    return await getWalletTransactions(
      context.auth,
      walletAddress,
      currency ?? 'usd',
      String(pageSize ?? 25)
    );
  },
});
