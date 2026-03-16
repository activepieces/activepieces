import { createAction, Property } from '@activepieces/pieces-framework';
import { aaveAuth } from '../aave-auth';
import { getMarketRates } from '../aave-api';

export const getMarketRatesAction = createAction({
  auth: aaveAuth,
  name: 'get_market_rates',
  displayName: 'Get Market Rates',
  description:
    'Fetch current supply APY and borrow APY for a specific Aave V3 asset by symbol (e.g. USDC, ETH) or underlying token address.',
  props: {
    asset: Property.ShortText({
      displayName: 'Asset Symbol or Address',
      description:
        'Token symbol (e.g. USDC, WETH, DAI) or the underlying token contract address (0x...).',
      required: true,
    }),
  },
  async run(context) {
    const apiKey = context.auth as string | undefined;
    const { asset } = context.propsValue;

    const rates = await getMarketRates(asset, apiKey);

    if (!rates || (Array.isArray(rates) && rates.length === 0)) {
      throw new Error(
        `No reserve found for asset "${asset}". Check the symbol or address and try again.`
      );
    }

    return {
      asset,
      markets: rates,
    };
  },
});
