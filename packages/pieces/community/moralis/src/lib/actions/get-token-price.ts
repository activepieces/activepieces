import { createAction, Property } from '@activepieces/pieces-framework';
import { moralisAuth } from '../..';
import { moralisRequest } from '../common/moralis-api';

interface TokenPriceResult {
  usdPrice: number;
  nativePrice?: {
    value: string;
    decimals: number;
    name: string;
    symbol: string;
  };
  exchangeName?: string;
  exchangeAddress?: string;
}

export const getTokenPrice = createAction({
  name: 'get_token_price',
  displayName: 'Get Token Price',
  description:
    'Get the current USD price of any ERC-20 token by contract address.',
  auth: moralisAuth,
  requireAuth: true,
  props: {
    address: Property.ShortText({
      displayName: 'Token Contract Address',
      description: 'The ERC-20 token contract address to get the price for.',
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
    const data = await moralisRequest<TokenPriceResult>(
      auth as string,
      `/erc20/${propsValue.address}/price`,
      { chain: propsValue.chain }
    );

    return {
      token_address: propsValue.address,
      chain: propsValue.chain,
      usd_price: data.usdPrice,
      native_price: data.nativePrice ?? null,
      exchange_name: data.exchangeName ?? null,
      exchange_address: data.exchangeAddress ?? null,
    };
  },
});
