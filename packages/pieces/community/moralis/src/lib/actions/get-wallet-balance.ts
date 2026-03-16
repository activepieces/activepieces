import { createAction, Property } from '@activepieces/pieces-framework';
import { moralisAuth } from '../..';
import { moralisRequest } from '../common/moralis-api';

export const getWalletBalance = createAction({
  name: 'get_wallet_balance',
  displayName: 'Get Wallet Balance',
  description:
    'Get native token balance for any EVM wallet across multiple chains.',
  auth: moralisAuth,
  requireAuth: true,
  props: {
    address: Property.ShortText({
      displayName: 'Wallet Address',
      description: 'The EVM wallet address to get the balance for.',
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
  },
  async run({ auth, propsValue }) {
    const data = await moralisRequest<{ balance: string }>(
      auth as string,
      `/${propsValue.address}/balance`,
      { chain: propsValue.chain }
    );

    const balanceWei = BigInt(data.balance);
    const balanceEth = Number(balanceWei / BigInt(1e14)) / 1e4;

    return {
      address: propsValue.address,
      chain: propsValue.chain,
      balance_wei: data.balance,
      balance: balanceEth,
    };
  },
});
