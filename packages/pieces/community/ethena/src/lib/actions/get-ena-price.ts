import { createAction } from '@activepieces/pieces-framework';
import { getEnaPrice } from '../ethena-api';

export const getEnaTokenPrice = createAction({
  name: 'get_ena_price',
  displayName: 'Get ENA Token Price',
  description: 'Fetch the current ENA token price, market cap, and 24h trading volume from CoinGecko.',
  props: {},
  async run() {
    const data = await getEnaPrice();
    const ena = data.ethena;

    return {
      token: 'ENA',
      price_usd: ena.usd,
      price_formatted: `$${ena.usd.toFixed(6)}`,
      market_cap_usd: ena.usd_market_cap,
      market_cap_formatted: `$${Number(ena.usd_market_cap).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      volume_24h_usd: ena.usd_24h_vol,
      volume_24h_formatted: `$${Number(ena.usd_24h_vol).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      change_24h: ena.usd_24h_change,
      change_24h_formatted: `${ena.usd_24h_change.toFixed(2)}%`,
    };
  },
});
