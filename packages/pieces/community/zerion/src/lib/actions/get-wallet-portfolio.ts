import { createAction, Property } from '@activepieces/pieces-framework';
import { zerionAuth } from '../auth';
import { getWalletPortfolio } from '../zerion-api';

export const getWalletPortfolioAction = createAction({
  auth: zerionAuth,
  name: 'get_wallet_portfolio',
  displayName: 'Get Wallet Portfolio',
  description: 'Get total portfolio value, PnL, and chain breakdown for a wallet address.',
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
  },
  async run(context) {
    const { walletAddress, currency } = context.propsValue;
    return await getWalletPortfolio(context.auth, walletAddress, currency ?? 'usd');
  },
});
