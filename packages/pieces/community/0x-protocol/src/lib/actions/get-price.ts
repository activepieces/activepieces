import { createAction, Property } from '@activepieces/pieces-framework';
import { zeroExRequest, CHAIN_OPTIONS } from '../0x-api';
import { zeroExAuth } from '../../index';

export const getPrice = createAction({
  name: 'get_price',
  displayName: 'Get Swap Price',
  description: 'Get an indicative price for swapping one token for another using the 0x API.',
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
      displayName: 'Sell Token',
      description: 'Token symbol (e.g. ETH, DAI) or contract address to sell.',
      required: true,
    }),
    buyToken: Property.ShortText({
      displayName: 'Buy Token',
      description: 'Token symbol (e.g. USDC, WBTC) or contract address to buy.',
      required: true,
    }),
    sellAmount: Property.ShortText({
      displayName: 'Sell Amount',
      description: 'Amount of sell token in its smallest unit (wei for ETH).',
      required: true,
    }),
  },
  async run(context) {
    const { chainId, sellToken, buyToken, sellAmount } = context.propsValue;
    return zeroExRequest(
      context.auth as string,
      chainId,
      '/swap/v1/price',
      { sellToken, buyToken, sellAmount }
    );
  },
});
