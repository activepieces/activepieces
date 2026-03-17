import { createAction } from '@activepieces/pieces-framework';
import { getProtocolData } from '../ethena-api';

export const getProtocolTvl = createAction({
  name: 'get_protocol_tvl',
  displayName: 'Get Protocol TVL',
  description: 'Fetch the current Total Value Locked (TVL) for Ethena protocol with 1h, 1d, and 7d percentage changes.',
  props: {},
  async run() {
    const data = await getProtocolData();

    return {
      name: data.name,
      tvl: data.tvl,
      tvl_formatted: `$${Number(data.tvl).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      change_1h: data.change_1h ?? null,
      change_1d: data.change_1d ?? null,
      change_7d: data.change_7d ?? null,
      change_1h_formatted: data.change_1h != null ? `${data.change_1h.toFixed(2)}%` : 'N/A',
      change_1d_formatted: data.change_1d != null ? `${data.change_1d.toFixed(2)}%` : 'N/A',
      change_7d_formatted: data.change_7d != null ? `${data.change_7d.toFixed(2)}%` : 'N/A',
    };
  },
});
