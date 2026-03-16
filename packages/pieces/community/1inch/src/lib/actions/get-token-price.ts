import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { oneInchRequest } from '../1inch-api';
import { chainIdDropdown } from '../chain-dropdown';

export const getTokenPrice = createAction({
  name: 'get_token_price',
  displayName: 'Get Token Price',
  description: 'Get the current USD price of a token on a given chain',
  props: {
    chainId: chainIdDropdown,
    tokenAddress: Property.ShortText({
      displayName: 'Token Address',
      description: 'Contract address of the token to get price for',
      required: true,
    }),
  },
  async run(context) {
    const { chainId, tokenAddress } = context.propsValue;
    const response = await oneInchRequest(
      context.auth as string,
      HttpMethod.GET,
      `/price/v1.1/${chainId}/${tokenAddress}`
    );
    return response.body;
  },
});
