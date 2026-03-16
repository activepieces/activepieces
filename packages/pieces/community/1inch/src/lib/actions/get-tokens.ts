import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { oneInchRequest } from '../1inch-api';
import { chainIdDropdown } from '../chain-dropdown';

export const getTokens = createAction({
  name: 'get_tokens',
  displayName: 'Get Supported Tokens',
  description: 'List all tokens supported by 1inch on a given chain',
  props: {
    chainId: chainIdDropdown,
  },
  async run(context) {
    const { chainId } = context.propsValue;
    const response = await oneInchRequest(
      context.auth as string,
      HttpMethod.GET,
      `/swap/v1.6/${chainId}/tokens`
    );
    return response.body;
  },
});
