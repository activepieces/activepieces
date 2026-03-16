import { createAction } from '@activepieces/pieces-framework';
import { getDiggPrice as fetchDiggPrice } from '../badger-api';

export const getDiggPrice = createAction({
  name: 'get_digg_price',
  displayName: 'Get DIGG Price',
  description: 'Returns the current DIGG token price in USD and BTC. DIGG is an elastic supply synthetic Bitcoin by Badger DAO, including 24-hour price change, from CoinGecko.',
  props: {},
  async run() {
    const data = await fetchDiggPrice();
    const digg = data['digg'] || {};
    return {
      token: 'DIGG',
      description: 'Elastic supply synthetic Bitcoin by Badger DAO',
      priceUsd: digg.usd,
      priceBtc: digg.btc,
      change24hUsd: digg.usd_24h_change,
      change24hBtc: digg.btc_24h_change,
      source: 'CoinGecko',
    };
  },
});
