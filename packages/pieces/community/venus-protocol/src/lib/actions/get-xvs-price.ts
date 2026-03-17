import { createAction } from '@activepieces/pieces-framework';
import { getXvsTokenData } from '../venus-protocol-api';

export const getXvsPrice = createAction({
  name: 'get_xvs_price',
  displayName: 'Get XVS Token Price',
  description: 'Fetch the current price, market cap, and 24h trading volume for the XVS governance token from CoinGecko.',
  props: {},
  async run() {
    const token = await getXvsTokenData();
    const md = token.market_data;

    return {
      name: token.name,
      symbol: token.symbol.toUpperCase(),
      price_usd: md.current_price.usd,
      market_cap_usd: md.market_cap.usd,
      volume_24h_usd: md.total_volume.usd,
      price_change_24h_pct: md.price_change_percentage_24h,
      price_change_7d_pct: md.price_change_percentage_7d,
      circulating_supply: md.circulating_supply,
      total_supply: md.total_supply,
      max_supply: md.max_supply,
      ath_usd: md.ath.usd,
      ath_date: md.ath_date.usd,
    };
  },
});
