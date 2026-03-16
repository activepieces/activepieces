import { createAction, Property } from '@activepieces/pieces-framework';
import { zeroExRequest, CHAIN_OPTIONS } from '../0x-api';
import { zeroExAuth } from '../../index';

export const getQuote = createAction({
  name: 'get_quote',
  displayName: 'Get Swap Quote',
  description: 'Get a full executable swap quote with calldata from the 0x API. Use this to construct an on-chain swap transaction.',
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
    takerAddress: Property.ShortText({
      displayName: 'Taker Address',
      description: '(Optional) The wallet address that will perform the swap. Required for validation.',
      required: false,
    }),
  },
  async run(context) {
    const { chainId, sellToken, buyToken, sellAmount, takerAddress } = context.propsValue;
    return zeroExRequest(
      context.auth as string,
      chainId,
      '/swap/v1/quote',
      { sellToken, buyToken, sellAmount, takerAddress: takerAddress ?? undefined }
    );
  },
});
