import { createAction } from '@activepieces/pieces-framework';
import { coinGeckoGet, CARDANO_SLUG } from '../common/cardano-api';

export const getAdaPrice = createAction({
  name: 'get_ada_price',
  displayName: 'Get ADA Price',
  description:
    'Retrieve the current ADA price, market cap, 24h volume, and price change from CoinGecko.',
  props: {},
  async run() {
    const data = await coinGeckoGet(`/coins/${CARDANO_SLUG}`);
    const market = data.market_data ?? {};
    return {
      name: data.name,
      symbol: (data.symbol ?? '').toUpperCase(),
      current_price_usd: market.current_price?.usd,
      market_cap_usd: market.market_cap?.usd,
      total_volume_usd: market.total_volume?.usd,
      price_change_24h_pct: market.price_change_percentage_24h,
      ath_usd: market.ath?.usd,
      circulating_supply: market.circulating_supply,
      total_supply: market.total_supply,
      last_updated: data.last_updated,
    };
  },
});
