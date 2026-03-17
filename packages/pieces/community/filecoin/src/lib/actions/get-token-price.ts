import { createAction } from '@activepieces/pieces-framework';

export const getTokenPrice = createAction({
  name: 'get_fil_price',
  displayName: 'Get FIL Token Price',
  description: 'Fetch live FIL token price, market cap, and 24h volume from CoinGecko',
  props: {},
  async run() {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=filecoin&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true'
    );
    if (!response.ok) throw new Error(`CoinGecko API error: ${response.status}`);
    const data = await response.json();
    const d = data['filecoin'];
    return {
      price_usd: d['usd'],
      price_change_24h: d['usd_24h_change'],
      market_cap_usd: d['usd_market_cap'],
      volume_24h_usd: d['usd_24h_vol'],
    };
  },
});
