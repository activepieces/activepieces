import { createAction } from '@activepieces/pieces-framework';
import { getWellTokenData } from '../moonwell-api';

export const getWellPrice = createAction({
  name: 'get_well_price',
  displayName: 'Get WELL Token Price',
  description:
    'Retrieves live WELL token price, market cap, 24h trading volume, and price change percentages from CoinGecko.',
  props: {},
  async run() {
    const tokenData = await getWellTokenData();
    const md = tokenData.market_data;

    return {
      name: tokenData.name,
      symbol: tokenData.symbol.toUpperCase(),
      price_usd: md.current_price.usd,
      price_usd_formatted: `$${md.current_price.usd.toFixed(6)}`,
      market_cap_usd: md.market_cap.usd,
      market_cap_formatted: `$${md.market_cap.usd.toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
      volume_24h_usd: md.total_volume.usd,
      volume_24h_formatted: `$${md.total_volume.usd.toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
      price_change_24h_pct: md.price_change_percentage_24h,
      price_change_7d_pct: md.price_change_percentage_7d,
      price_change_30d_pct: md.price_change_percentage_30d,
      circulating_supply: md.circulating_supply,
      total_supply: md.total_supply,
      max_supply: md.max_supply,
    };
  },
});
