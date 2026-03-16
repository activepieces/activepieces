import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { oneInchRequest } from '../1inch-api';
import { chainIdDropdown } from '../chain-dropdown';

export const getSwap = createAction({
  name: 'get_swap',
  displayName: 'Get Swap Transaction',
  description: 'Get full swap transaction data ready to broadcast on-chain',
  props: {
    chainId: chainIdDropdown,
    src: Property.ShortText({
      displayName: 'Source Token Address',
      description: 'Contract address of the token to swap from',
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
    from: Property.ShortText({
      displayName: 'From Address',
      description: 'Wallet address that will execute the swap',
      required: true,
    }),
    slippage: Property.Number({
      displayName: 'Slippage (%)',
      description: 'Maximum acceptable slippage percentage (e.g. 1 for 1%)',
      required: true,
    }),
  },
  async run(context) {
    const { chainId, src, dst, amount, from, slippage } = context.propsValue;
    const response = await oneInchRequest(
      context.auth as string,
      HttpMethod.GET,
      `/swap/v1.6/${chainId}/swap`,
      {
        src,
        dst,
        amount,
        from,
        slippage: String(slippage),
      }
    );
    return response.body;
  },
});
