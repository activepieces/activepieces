import { createAction } from '@activepieces/pieces-framework';
import { getBeetsTokenPrice } from '../common/beethoven-api';

export const getBeetsPrice = createAction({
  name: 'get_beets_price',
  displayName: 'Get BEETS Price',
  description: 'Get the current BEETS token price in USD and BTC with 24-hour change.',
  props: {},
  async run() {
    const data = await getBeetsTokenPrice();
    const beets = data['beethoven-x'];

    return {
      priceUsd: beets?.usd ?? null,
      priceBtc: beets?.btc ?? null,
      change24hUsd: beets?.usd_24h_change ?? null,
      change24hBtc: beets?.btc_24h_change ?? null,
      symbol: 'BEETS',
      name: 'Beethoven X',
    };
  },
});
