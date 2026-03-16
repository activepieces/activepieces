import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { oneInchRequest } from '../1inch-api';
import { chainIdDropdown } from '../chain-dropdown';

export const getQuote = createAction({
  name: 'get_quote',
  displayName: 'Get Swap Quote',
  description: 'Get the best swap quote across all DEXes for a token pair',
  props: {
    chainId: chainIdDropdown,
    src: Property.ShortText({
      displayName: 'Source Token Address',
      description: 'Contract address of the token to swap from (e.g. 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE for native)',
      required: true,
    }),
    dst: Property.ShortText({
      displayName: 'Destination Token Address',
      description: 'Contract address of the token to swap to',
      required: true,
    }),
    amount: Property.ShortText({
      displayName: 'Amount (in wei)',
      description: 'Amount of source token to swap, in smallest unit (wei)',
      required: true,
    }),
  },
  async run(context) {
    const { chainId, src, dst, amount } = context.propsValue;
    const response = await oneInchRequest(
      context.auth as string,
      HttpMethod.GET,
      `/swap/v1.6/${chainId}/quote`,
      { src, dst, amount }
    );
    return response.body;
  },
});
