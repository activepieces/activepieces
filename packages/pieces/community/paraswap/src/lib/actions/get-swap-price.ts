import { createAction, Property } from '@activepieces/pieces-framework';
import { PARASWAP_API_BASE, NETWORK_OPTIONS } from '../common/paraswap-api';

export const getSwapPrice = createAction({
  name: 'get_swap_price',
  displayName: 'Get Swap Price',
  description: 'Get the best swap route and price across all DEXes via ParaSwap API',
  props: {
    srcToken: Property.ShortText({
      displayName: 'Source Token Address',
      description: 'Contract address of the token to swap from (use 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE for native ETH/MATIC)',
      required: true,
      defaultValue: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    }),
    destToken: Property.ShortText({
      displayName: 'Destination Token Address',
      description: 'Contract address of the token to swap to',
      required: true,
      defaultValue: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    }),
    amount: Property.ShortText({
      displayName: 'Amount (in wei)',
      description: 'Amount to swap in the smallest unit (e.g. 1000000000000000000 = 1 ETH)',
      required: true,
      defaultValue: '1000000000000000000',
    }),
    network: Property.StaticDropdown({
      displayName: 'Network',
      description: 'Blockchain network',
      required: true,
      options: {
        options: NETWORK_OPTIONS,
      },
      defaultValue: '1',
    }),
    partner: Property.ShortText({
      displayName: 'Partner',
      description: 'Partner identifier for fee sharing',
      required: false,
      defaultValue: 'paraswap.io',
    }),
  },
  async run(context) {
    const { srcToken, destToken, amount, network, partner } = context.propsValue;

    const params = new URLSearchParams({
      srcToken,
      destToken,
      amount,
      network: network as string,
      partner: partner || 'paraswap.io',
      srcDecimals: '18',
      destDecimals: '18',
    });

    const response = await fetch(`${PARASWAP_API_BASE}/prices/?${params.toString()}`);
    const data = await response.json() as any;

    if (data.error) {
      return { error: data.error };
    }

    const priceRoute = data.priceRoute;
    return {
      srcToken: priceRoute.srcToken,
      destToken: priceRoute.destToken,
      srcAmount: priceRoute.srcAmount,
      destAmount: priceRoute.destAmount,
      srcUSD: priceRoute.srcUSD,
      destUSD: priceRoute.destUSD,
      gasCostUSD: priceRoute.gasCostUSD,
      bestRoute: priceRoute.bestRoute,
      hmac: data.hmac,
    };
  },
});
