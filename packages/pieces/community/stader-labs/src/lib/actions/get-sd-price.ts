import { createAction } from '@activepieces/pieces-framework';
import { fetchSdPrice } from '../stader-api';

export const getSdPrice = createAction({
  name: 'get_sd_price',
  displayName: 'Get SD Token Price',
  description:
    'Fetch the current price, market cap, and 24-hour change for the SD (Stader) token from CoinGecko.',
  auth: undefined,
  props: {},
  async run() {
    const data = await fetchSdPrice();

    const coin = data.staderlabs;

    return {
      symbol: 'SD',
      priceUsd: coin.usd,
      marketCapUsd: coin.usd_market_cap,
      change24hPercent: Number(coin.usd_24h_change.toFixed(2)),
      source: 'CoinGecko',
    };
  },
});
