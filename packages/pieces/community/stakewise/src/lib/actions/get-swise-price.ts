import { createAction } from '@activepieces/pieces-framework';
import { fetchSwisePrice } from '../stakewise-api';

export const getSwisePrice = createAction({
  name: 'get_swise_price',
  displayName: 'Get SWISE Price',
  description: 'Fetch the current SWISE token price, market cap, and 24h change from CoinGecko.',
  auth: undefined,
  props: {},
  async run() {
    const data = await fetchSwisePrice();
    const swise = data.stakewise;

    return {
      token: 'SWISE',
      priceUsd: swise.usd,
      priceFormatted: `$${swise.usd.toFixed(6)}`,
      marketCapUsd: swise.usd_market_cap,
      marketCapFormatted: `$${swise.usd_market_cap.toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
      volume24hUsd: swise.usd_24h_vol,
      volume24hFormatted: `$${swise.usd_24h_vol.toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
      change24h: swise.usd_24h_change,
      change24hFormatted: `${swise.usd_24h_change >= 0 ? '+' : ''}${swise.usd_24h_change.toFixed(2)}%`,
    };
  },
});
