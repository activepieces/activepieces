import { createAction } from '@activepieces/pieces-framework';
import { fetchEigenPrice } from '../eigenlayer-api';

export const getEigenPrice = createAction({
  name: 'get_eigen_price',
  displayName: 'Get EIGEN Token Price',
  description:
    'Fetches the current price, market cap, and 24-hour change for the EIGEN token from CoinGecko.',
  props: {},
  async run() {
    const priceData = await fetchEigenPrice();
    const eigen = priceData.eigenlayer;

    return {
      price_usd: eigen.usd,
      market_cap_usd: eigen.usd_market_cap,
      price_change_24h_percent: Math.round(eigen.usd_24h_change * 100) / 100,
      price_formatted: `$${eigen.usd.toFixed(4)}`,
      market_cap_formatted: `$${(eigen.usd_market_cap / 1e9).toFixed(2)}B`,
    };
  },
});
