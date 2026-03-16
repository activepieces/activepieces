import { createAction, Property } from '@activepieces/pieces-framework';
import { zeroExRequest, CHAIN_OPTIONS } from '../0x-api';
import { zeroExAuth } from '../../index';

export const getTokenPriceUsd = createAction({
  name: 'get_token_price_usd',
  displayName: 'Get Token Price in USD',
  description: 'Get the USD-equivalent price of a token by pricing it against DAI via the 0x swap API.',
  auth: zeroExAuth,
  props: {
    chainId: Property.StaticDropdown({
      displayName: 'Chain',
      description: 'The blockchain network to use.',
      required: true,
      options: {
        options: CHAIN_OPTIONS,
      },
    }),
    sellToken: Property.ShortText({
      displayName: 'Token',
      description: 'Token symbol (e.g. ETH, WBTC) or contract address to price in USD.',
      required: true,
    }),
    sellAmount: Property.ShortText({
      displayName: 'Token Amount',
      description: 'Amount of the token in its smallest unit (e.g. 1000000000000000000 for 1 ETH).',
      required: true,
    }),
  },
  async run(context) {
    const { chainId, sellToken, sellAmount } = context.propsValue;
    const result = await zeroExRequest<{
      price: string;
      buyAmount: string;
      sellAmount: string;
      [key: string]: unknown;
    }>(
      context.auth as string,
      chainId,
      '/swap/v1/price',
      { sellToken, buyToken: 'DAI', sellAmount }
    );

    return {
      ...result,
      priceInUSD: result.price,
      buyAmountDAI: result.buyAmount,
    };
  },
});
