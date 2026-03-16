import { createAction } from '@activepieces/pieces-framework';
import { makeRequest, COINGECKO_BASE } from '../lib/instadapp-api';

export const getInstPrice = createAction({
  name: 'get_inst_price',
  displayName: 'Get INST Token Price',
  description: 'Get the INST governance token price, market cap, and 24h trading volume from CoinGecko.',
  props: {},
  async run() {
    const data = await makeRequest(
      '/simple/price?ids=instadapp&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true',
      COINGECKO_BASE
    );
    const inst = data['instadapp'];
    return {
      price_usd: inst?.usd,
      market_cap_usd: inst?.usd_market_cap,
      volume_24h_usd: inst?.usd_24h_vol,
      change_24h_pct: inst?.usd_24h_change,
      token: 'INST',
      source: 'CoinGecko',
    };
  },
});
