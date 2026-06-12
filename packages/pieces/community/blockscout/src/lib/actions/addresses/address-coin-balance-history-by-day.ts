import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getAddressCoinBalanceHistoryByDay = createAction({
  name: 'get_address_coin_balance_history_by_day',
  displayName: 'Get Address Coin Balance History By Day',
  description: 'Get list of coin balance changes for an address grouped by day',
  audience: 'both',
  aiMetadata: { description: 'Get an address’s native-coin (ETH) balance aggregated into one value per day, suited for charting or trend analysis. Pick this over Get Address Coin Balance History when you want a daily time series rather than every individual balance-changing event. Read-only lookup on eth.blockscout.com; requires a 0x address hash.', idempotent: true },
  // category: 'Addresses',
  props: {
    addressHash: Property.ShortText({
      displayName: 'Address Hash',
      description: 'Hash of the address to fetch daily coin balance history for',
      required: true,
    }),
  },
  async run(context) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://eth.blockscout.com/api/v2/addresses/${context.propsValue.addressHash}/coin-balance-history-by-day`,
    });
    if (response.status !== 200) {
      throw new Error(`Blockscout API request failed with status ${response.status}`);
    }
    return response.body;
  },
});
