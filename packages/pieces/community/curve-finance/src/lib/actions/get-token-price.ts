import { createAction, Property } from '@activepieces/pieces-framework';
import { curveRequest, CHAIN_OPTIONS } from '../curve-api';

export const getTokenPrice = createAction({
  name: 'get_token_price',
  displayName: 'Get Token Price',
  description: 'Get the USD price of a token traded on Curve Finance',
  props: {
    chain: Property.StaticDropdown({
      displayName: 'Chain',
      required: true,
      options: { options: CHAIN_OPTIONS },
    }),
    tokenAddress: Property.ShortText({
      displayName: 'Token Address',
      description: 'Contract address of the token (e.g. CRV: 0xD533a949740bb3306d119CC777fa900bA034cd52)',
      required: true,
    }),
  },
  async run(ctx) {
    const { chain, tokenAddress } = ctx.propsValue;
    const data = await curveRequest<any>(`/getTokenPrice/${chain}/${tokenAddress}`);
    return data;
  },
});
