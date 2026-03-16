import { createAction } from '@activepieces/pieces-framework';
import { getSolidTokenPrice } from '../common/solidly-api';

export const getSolidPrice = createAction({
  name: 'get_solid_price',
  displayName: 'Get SOLID Token Price',
  description: 'Get the current SOLID token price in USD and BTC, including 24-hour change.',
  auth: undefined,
  props: {},
  async run() {
    const data = await getSolidTokenPrice();
    const solidData = data['solid'] ?? {};

    return {
      usd: solidData['usd'] ?? null,
      btc: solidData['btc'] ?? null,
      usd_24h_change: solidData['usd_24h_change'] ?? null,
      btc_24h_change: solidData['btc_24h_change'] ?? null,
    };
  },
});
