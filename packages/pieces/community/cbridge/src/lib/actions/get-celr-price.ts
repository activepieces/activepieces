import { createAction, Property } from '@activepieces/pieces-framework';
import { coinGeckoGet, CELR_COINGECKO_ID } from '../common/defillama-api';

interface CoinGeckoPriceResponse {
  [coinId: string]: {
    usd: number;
    usd_market_cap?: number;
    usd_24h_vol?: number;
    usd_24h_change?: number;
  };
}

export const getCelrPrice = createAction({
  name: 'get_celr_price',
  displayName: 'Get CELR Token Price',
  description:
    'Fetch the current price of CELR (Celer Network governance token) from CoinGecko.',
  props: {
    includeMeta: Property.Checkbox({
      displayName: 'Include Market Cap & Volume',
      description: 'Also return market cap, 24h volume, and 24h price change.',
      required: false,
      defaultValue: true,
    }),
  },
  async run({ propsValue }) {
    const { includeMeta } = propsValue;
    const params: Record<string, string> = {
      ids: CELR_COINGECKO_ID,
      vs_currencies: 'usd',
    };
    if (includeMeta) {
      params['include_market_cap'] = 'true';
      params['include_24hr_vol'] = 'true';
      params['include_24hr_change'] = 'true';
    }
    const data = await coinGeckoGet<CoinGeckoPriceResponse>(
      '/simple/price',
      params
    );
    const entry = data[CELR_COINGECKO_ID];
    if (!entry) {
      throw new Error(
        `CELR token price not found. CoinGecko ID used: "${CELR_COINGECKO_ID}".`
      );
    }
    return {
      token: 'CELR',
      coingecko_id: CELR_COINGECKO_ID,
      price_usd: entry.usd,
      market_cap_usd: entry.usd_market_cap ?? null,
      volume_24h_usd: entry.usd_24h_vol ?? null,
      price_change_24h_pct: entry.usd_24h_change ?? null,
    };
  },
});
