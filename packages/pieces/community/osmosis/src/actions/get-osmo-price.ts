import { createAction } from '@activepieces/pieces-framework';
import { getOsmoPrice } from '../lib/osmosis-api';

export const getOsmoPriceAction = createAction({
  name: 'get_osmo_price',
  displayName: 'Get OSMO Price',
  description: 'Fetch the current OSMO token price (USD), market cap, and 24-hour trading volume from CoinGecko.',
  props: {},
  async run() {
    const data = await getOsmoPrice();
    const osmosisData = data?.osmosis ?? {};
    return {
      price_usd: osmosisData['usd'],
      market_cap_usd: osmosisData['usd_market_cap'],
      volume_24h_usd: osmosisData['usd_24h_vol'],
      raw: data,
    };
  },
});
