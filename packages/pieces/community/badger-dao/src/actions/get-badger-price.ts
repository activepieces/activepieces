import { createAction } from '@activepieces/pieces-framework';
import { getBadgerPrice as fetchBadgerPrice } from '../badger-api';

export const getBadgerPrice = createAction({
  name: 'get_badger_price',
  displayName: 'Get BADGER Price',
  description: 'Returns the current BADGER token price in USD and BTC, including 24-hour price change, from CoinGecko.',
  props: {},
  async run() {
    const data = await fetchBadgerPrice();
    const badger = data['badger-dao'] || {};
    return {
      token: 'BADGER',
      priceUsd: badger.usd,
      priceBtc: badger.btc,
      change24hUsd: badger.usd_24h_change,
      change24hBtc: badger.btc_24h_change,
      source: 'CoinGecko',
    };
  },
});
