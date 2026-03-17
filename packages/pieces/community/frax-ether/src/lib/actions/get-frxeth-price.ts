import { createAction } from '@activepieces/pieces-framework';
import { getCoinData, formatUSD, formatPercent } from '../frax-ether-api';

export const getFrxethPrice = createAction({
  name: 'get-frxeth-price',
  displayName: 'Get frxETH Price',
  description: 'Fetch frxETH price, market cap, and 24h change from CoinGecko.',
  props: {},
  async run() {
    const data = await getCoinData('frax-ether');

    const price = data.market_data.current_price.usd;
    const marketCap = data.market_data.market_cap.usd;
    const change24h = data.market_data.price_change_percentage_24h;
    const volume24h = data.market_data.total_volume.usd;

    return {
      id: data.id,
      symbol: data.symbol.toUpperCase(),
      name: data.name,
      price_usd: price,
      price_formatted: formatUSD(price),
      market_cap_usd: marketCap,
      market_cap_formatted: formatUSD(marketCap),
      price_change_24h_percent: change24h,
      price_change_24h_formatted: formatPercent(change24h),
      volume_24h_usd: volume24h,
      volume_24h_formatted: formatUSD(volume24h),
    };
  },
});
