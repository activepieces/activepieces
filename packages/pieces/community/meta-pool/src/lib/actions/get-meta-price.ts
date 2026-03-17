import { createAction } from '@activepieces/pieces-framework';
import { fetchTokenPrice } from '../meta-pool-api';

export const getMetaPrice = createAction({
  name: 'get-meta-price',
  displayName: 'Get META Token Price',
  description: 'Get the current mpDAO (META) token price, market cap, and 24h price change from CoinGecko.',
  props: {},
  async run() {
    const data = await fetchTokenPrice();

    const price = data.market_data?.current_price?.usd ?? 0;
    const marketCap = data.market_data?.market_cap?.usd ?? 0;
    const change24h = data.market_data?.price_change_percentage_24h ?? 0;
    const volume24h = data.market_data?.total_volume?.usd ?? 0;

    return {
      token_id: data.id,
      symbol: data.symbol?.toUpperCase(),
      name: data.name,
      price_usd: price,
      price_formatted: `$${price.toFixed(6)}`,
      market_cap_usd: marketCap,
      market_cap_formatted: `$${marketCap.toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
      price_change_24h_pct: parseFloat(change24h.toFixed(2)),
      volume_24h_usd: volume24h,
      fetched_at: new Date().toISOString(),
    };
  },
});
