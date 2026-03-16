import { createAction } from '@activepieces/pieces-framework';
import { geckoGet, GNO_COIN_ID } from '../gnosis-api';

export const getGnoPrice = createAction({
  name: 'get_gno_price',
  displayName: 'Get GNO Price',
  description: 'Get the current GNO token price, market cap, 24h trading volume, and price change from CoinGecko.',
  props: {},
  async run() {
    const data = await geckoGet<Record<string, unknown>>(
      `/coins/${GNO_COIN_ID}?localization=false&tickers=false&community_data=false&developer_data=false`
    );
    const market = (data['market_data'] as Record<string, unknown>) ?? {};
    return {
      id: data['id'],
      symbol: data['symbol'],
      name: data['name'],
      price_usd: (market['current_price'] as Record<string, number>)?.['usd'],
      market_cap_usd: (market['market_cap'] as Record<string, number>)?.['usd'],
      volume_24h_usd: (market['total_volume'] as Record<string, number>)?.['usd'],
      price_change_24h_pct: market['price_change_percentage_24h'],
      circulating_supply: market['circulating_supply'],
      total_supply: market['total_supply'],
      ath_usd: (market['ath'] as Record<string, number>)?.['usd'],
    };
  },
});
