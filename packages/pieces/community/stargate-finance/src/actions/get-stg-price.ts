import { createAction } from '@activepieces/pieces-framework';
import { fetchStgPrice } from '../lib/stargate-api';

export const getStgPrice = createAction({
  name: 'get_stg_price',
  displayName: 'Get STG Token Price',
  description: 'Get the current STG token price in USD, including market cap and 24h trading volume from CoinGecko.',
  props: {},
  async run() {
    return await fetchStgPrice();
  },
});
