import { createAction } from '@activepieces/pieces-framework';
import { getPicklePrice as fetchPrice, getCoinMarketData } from '../pickle-api';

export const getPicklePrice = createAction({
  name: 'get_pickle_price',
  displayName: 'Get PICKLE Price',
  description: 'Returns the current PICKLE token price in USD and BTC, along with 24h price change, market cap, trading volume, and supply data from CoinGecko.',
  props: {},
  async run() {
    const [price, market] = await Promise.all([fetchPrice(), getCoinMarketData()]);
    return {
      price_usd: price.usd,
      price_btc: price.btc,
      price_change_24h_pct: price.usd_24h_change,
      market_cap_usd: market.market_data.market_cap.usd,
      volume_24h_usd: market.market_data.total_volume.usd,
      price_change_7d_pct: market.market_data.price_change_percentage_7d,
      price_change_30d_pct: market.market_data.price_change_percentage_30d,
      circulating_supply: market.market_data.circulating_supply,
      total_supply: market.market_data.total_supply,
      ath_usd: market.market_data.ath.usd,
      ath_date: market.market_data.ath_date.usd,
      atl_usd: market.market_data.atl.usd,
    };
  },
});
