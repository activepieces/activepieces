import { createAction } from '@activepieces/pieces-framework';
import { getCoinGeckoAxelar } from '../axelar-api';

export const getAxlPrice = createAction({
  name: 'get_axl_price',
  displayName: 'Get AXL Price',
  description: 'Get AXL governance token price, market cap, and 24h volume from CoinGecko',
  auth: undefined,
  props: {},
  async run() {
    const data = await getCoinGeckoAxelar();
    const market = data.market_data;
    return {
      price_usd: market.current_price?.usd,
      market_cap_usd: market.market_cap?.usd,
      volume_24h_usd: market.total_volume?.usd,
      price_change_24h_pct: market.price_change_percentage_24h,
      price_change_7d_pct: market.price_change_percentage_7d,
      circulating_supply: market.circulating_supply,
      total_supply: market.total_supply,
      ath_usd: market.ath?.usd,
      atl_usd: market.atl?.usd,
    };
  },
});
