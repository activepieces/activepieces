import { createAction, Property } from '@activepieces/pieces-framework';
import { zerionAuth } from '../auth';
import { getWalletNfts } from '../zerion-api';

export const getWalletNftsAction = createAction({
  auth: zerionAuth,
  name: 'get_wallet_nfts',
  displayName: 'Get Wallet NFTs',
  description: 'Get NFT holdings for a wallet address.',
  props: {
    walletAddress: Property.ShortText({
      displayName: 'Wallet Address',
      description: 'The Ethereum wallet address (0x...) or ENS name.',
      required: true,
    }),
    currency: Property.StaticDropdown({
      displayName: 'Currency',
      description: 'The currency to display NFT values in.',
      required: false,
      defaultValue: 'usd',
      options: {
        options: [
          { label: 'USD', value: 'usd' },
          { label: 'EUR', value: 'eur' },
          { label: 'GBP', value: 'gbp' },
          { label: 'ETH', value: 'eth' },
        ],
      },
    }),
  },
  async run(context) {
    const { walletAddress, currency } = context.propsValue;
    return await getWalletNfts(context.auth, walletAddress, currency ?? 'usd');
  },
});
