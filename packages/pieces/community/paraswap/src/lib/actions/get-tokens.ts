import { createAction, Property } from '@activepieces/pieces-framework';
import { PARASWAP_API_BASE, NETWORK_OPTIONS } from '../common/paraswap-api';

export const getTokens = createAction({
  name: 'get_tokens',
  displayName: 'Get Supported Tokens',
  description: 'Get list of supported tokens for a given blockchain network',
  props: {
    network: Property.StaticDropdown({
      displayName: 'Network',
      description: 'Blockchain network to get tokens for',
      required: true,
      options: {
        options: NETWORK_OPTIONS,
      },
      defaultValue: '1',
    }),
  },
  async run(context) {
    const { network } = context.propsValue;

    const response = await fetch(`${PARASWAP_API_BASE}/tokens/${network}`);
    const data = await response.json() as any;

    const tokens = data.tokens || [];
    return {
      network,
      count: tokens.length,
      tokens: tokens.slice(0, 50).map((t: any) => ({
        symbol: t.symbol,
        address: t.address,
        decimals: t.decimals,
        name: t.name || t.symbol,
        img: t.img,
      })),
    };
  },
});
