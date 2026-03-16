import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, QueryParams } from '@activepieces/pieces-common';
import { arkhamAuth } from '../../index';
import { arkhamApiCall } from '../arkham-api';

export const getTopHoldersAction = createAction({
  auth: arkhamAuth,
  name: 'get-top-holders',
  displayName: 'Get Top Token Holders',
  description: 'Retrieve the top holders of an ERC-20 or other token, with entity attribution and balance data.',
  props: {
    tokenAddress: Property.ShortText({
      displayName: 'Token Address',
      description: 'The contract address of the token (e.g. USDC, WETH).',
      required: true,
    }),
    chain: Property.ShortText({
      displayName: 'Chain',
      description: 'Blockchain the token is on (e.g. ethereum, arbitrum, bsc, polygon).',
      required: true,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Number of top holders to return (default: 10).',
      required: false,
      defaultValue: 10,
    }),
  },
  async run(context) {
    const { tokenAddress, chain, limit } = context.propsValue;

    const queryParams: QueryParams = {
      tokenAddress,
      chain,
    };
    if (limit !== undefined && limit !== null) queryParams['limit'] = String(limit);

    const data = await arkhamApiCall({
      apiKey: context.auth,
      endpoint: '/token/top_holders',
      method: HttpMethod.GET,
      queryParams,
    });
    return data;
  },
});
