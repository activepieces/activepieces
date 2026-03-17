import { createAction, Property } from '@activepieces/pieces-framework';
import { fetchKelpProtocol, parseTvlHistory } from '../kelpdao-api';

export const getTvlHistory = createAction({
  name: 'get_tvl_history',
  displayName: 'Get TVL History',
  description:
    'Fetches historical TVL data for Kelp DAO. Returns daily TVL entries for the specified number of recent days.',
  props: {
    days: Property.Number({
      displayName: 'Days',
      description: 'Number of recent days to return (default: 30)',
      required: false,
      defaultValue: 30,
    }),
  },
  async run(context) {
    const days = context.propsValue.days ?? 30;
    const protocol = await fetchKelpProtocol();
    const result = parseTvlHistory(protocol, days);

    return result;
  },
});
