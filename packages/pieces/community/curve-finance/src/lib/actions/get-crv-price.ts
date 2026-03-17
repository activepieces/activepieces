import { createAction } from '@activepieces/pieces-framework';
import { getCrvTokenData, formatUSD } from '../curve-finance-api';

export const getCrvPriceAction = createAction({
  name: 'get_crv_price',
  displayName: 'Get CRV Token Price',
  description: 'Fetches the current CRV token price, market cap, 24h volume, and price change from CoinGecko.',
  props: {},
  async run() {
    const data = await getCrvTokenData();
    const md = data.market_data;
    return {
      name: data.name,
      symbol: data.symbol.toUpperCase(),
      priceUsd: md.current_price.usd,
      priceFormatted: formatUSD(md.current_price.usd),
      marketCap: md.market_cap.usd,
      marketCapFormatted: formatUSD(md.market_cap.usd),
      volume24h: md.total_volume.usd,
      volume24hFormatted: formatUSD(md.total_volume.usd),
      priceChange24h: md.price_change_percentage_24h,
      circulatingSupply: md.circulating_supply,
      lastUpdated: data.last_updated,
    };
  },
});
