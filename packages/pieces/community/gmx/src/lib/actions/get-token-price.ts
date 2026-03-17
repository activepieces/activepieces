import { createAction } from '@activepieces/pieces-framework';

export const getTokenPrice = createAction({
  name: 'get_gmx_price',
  displayName: 'Get GMX Token Price',
  description: 'Fetch live GMX token price, market cap, and 24h volume from CoinGecko',
  props: {},
  async run() {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=gmx&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true'
    );
    if (!response.ok) throw new Error(`CoinGecko API error: ${response.status}`);
    const data = await response.json();
    const gmxData = data['gmx'];
    return {
      price_usd: gmxData['usd'],
      price_change_24h: gmxData['usd_24h_change'],
      market_cap_usd: gmxData['usd_market_cap'],
      volume_24h_usd: gmxData['usd_24h_vol'],
    };
  },
});