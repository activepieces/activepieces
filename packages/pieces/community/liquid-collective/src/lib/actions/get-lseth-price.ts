import { createAction } from '@activepieces/pieces-framework';
import { fetchLsethPrice } from '../liquid-collective-api';

export const getLsethPrice = createAction({
  name: 'get_lseth_price',
  displayName: 'Get LsETH Price',
  description:
    'Fetch the current price, market cap, and 24-hour change for LsETH (Liquid Staked ETH) from CoinGecko.',
  auth: undefined,
  props: {},
  async run() {
    const priceData = await fetchLsethPrice();

    return {
      priceUsd: priceData.usd,
      priceFormatted: `$${priceData.usd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      marketCapUsd: priceData.usd_market_cap ?? null,
      marketCapFormatted: priceData.usd_market_cap
        ? `$${priceData.usd_market_cap.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
        : null,
      change24hPercent: priceData.usd_24h_change ?? null,
      change24hFormatted: priceData.usd_24h_change
        ? `${priceData.usd_24h_change.toFixed(2)}%`
        : null,
    };
  },
});
