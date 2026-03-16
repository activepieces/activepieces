import { createAction, Property } from '@activepieces/pieces-framework';
import { zerionAuth } from '../auth';
import { getWalletPositions } from '../zerion-api';

export const getWalletPositionsAction = createAction({
  auth: zerionAuth,
  name: 'get_wallet_positions',
  displayName: 'Get Wallet Positions',
  description: 'Get all token positions with current prices for a wallet address.',
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
    filterPositionTypes: Property.StaticDropdown({
      displayName: 'Position Type Filter',
      description: 'Filter positions by type.',
      required: false,
      defaultValue: 'wallet',
      options: {
        options: [
          { label: 'Wallet (token balances)', value: 'wallet' },
          { label: 'Deposited (DeFi deposits)', value: 'deposited' },
          { label: 'Borrowed (DeFi loans)', value: 'borrowed' },
          { label: 'Locked (staked/locked)', value: 'locked' },
          { label: 'Staked', value: 'staked' },
        ],
      },
    }),
  },
  async run(context) {
    const { walletAddress, currency, filterPositionTypes } = context.propsValue;
    return await getWalletPositions(
      context.auth,
      walletAddress,
      currency ?? 'usd',
      filterPositionTypes ?? 'wallet'
    );
  },
});
