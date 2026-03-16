import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { oneInchRequest } from '../1inch-api';
import { chainIdDropdown } from '../chain-dropdown';

export const getLiquiditySources = createAction({
  name: 'get_liquidity_sources',
  displayName: 'Get Liquidity Sources',
  description: 'List all DEX protocols and liquidity sources aggregated by 1inch on a given chain',
  props: {
    chainId: chainIdDropdown,
  },
  async run(context) {
    const { chainId } = context.propsValue;
    const response = await oneInchRequest(
      context.auth as string,
      HttpMethod.GET,
      `/swap/v1.6/${chainId}/liquidity-sources`
    );
    return response.body;
  },
});
