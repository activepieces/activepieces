import { createAction, Property } from '@activepieces/pieces-framework';
import { getTvlHistory } from '../swell-api';

export const getTvlHistoryAction = createAction({
  name: 'get-tvl-history',
  displayName: 'Get TVL History',
  description: 'Fetches historical TVL data for Swell Network from DeFiLlama with a configurable lookback period, including percentage change over the period.',
  props: {
    days: Property.Number({
      displayName: 'Days',
      description: 'Number of historical days to retrieve (default: 30)',
      required: false,
      defaultValue: 30,
    }),
  },
  async run(context) {
    const days = context.propsValue.days ?? 30;
    return await getTvlHistory(days);
  },
});
