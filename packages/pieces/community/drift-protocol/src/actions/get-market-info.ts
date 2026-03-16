import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { DRIFT_API_BASE, DRIFT_MARKET_OPTIONS } from '../lib/drift-api';

export const getMarketInfo = createAction({
  name: 'get_market_info',
  displayName: 'Get Market Info',
  description: 'Get detailed info for a specific Drift Protocol perpetual market',
  props: {
    marketIndex: Property.StaticDropdown({
      displayName: 'Market',
      description: 'Select the perpetual market to query',
      required: true,
      options: {
        options: DRIFT_MARKET_OPTIONS,
      },
    }),
  },
  async run(context) {
    const { marketIndex } = context.propsValue;
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${DRIFT_API_BASE}/market/${marketIndex}`,
    });
    return response.body;
  },
});
