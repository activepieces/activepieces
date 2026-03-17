import { createAction } from '@activepieces/pieces-framework';
import { fetchRsEthPrice } from '../kelpdao-api';

export const getRsEthPrice = createAction({
  name: 'get_rseth_price',
  displayName: 'Get rsETH Price',
  description:
    "Fetches the current price and market data for rsETH (Kelp DAO's liquid restaking token) from CoinGecko.",
  props: {},
  async run() {
    return await fetchRsEthPrice();
  },
});
