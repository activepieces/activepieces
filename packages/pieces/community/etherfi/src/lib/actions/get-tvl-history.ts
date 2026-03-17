import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { parseTvlHistory } from '../etherfi-api';

export const getTvlHistory = createAction({
  name: 'get-tvl-history',
  displayName: 'Get TVL History',
  description: 'Fetch historical TVL data for Ether.fi over a configurable number of days.',
  props: {
    days: Property.Number({
      displayName: 'Number of Days',
      description: 'How many days of historical TVL data to return (default: 30).',
      required: false,
      defaultValue: 30,
    }),
  },
  async run(context) {
    const days = context.propsValue.days ?? 30;

    const response = await httpClient.sendRequest<{
      tvl: { date: number; totalLiquidityUSD: number }[];
    }>({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/ether.fi',
    });

    const tvlArray = response.body.tvl ?? [];
    const history = parseTvlHistory(tvlArray, days);

    return {
      days_requested: days,
      days_returned: history.length,
      history,
    };
  },
});
