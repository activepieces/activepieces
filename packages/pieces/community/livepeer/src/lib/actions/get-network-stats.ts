import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getNetworkStats = createAction({
  name: 'get_network_stats',
  displayName: 'Get Network Stats',
  description: 'Get Livepeer network statistics including active orchestrators, total stake, and participation rate.',
  props: {},
  async run() {
    const query = `
      {
        protocol(id: "0") {
          totalActiveStake
          participationRate
          numActiveTranscoders
          roundLength
          inflationChange
          inflation
          totalSupply
        }
      }
    `;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.thegraph.com/subgraphs/name/livepeer/arbitrum-delta',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    });

    const body = response.body as { data?: { protocol?: Record<string, unknown> } };
    const protocol = body?.data?.protocol;

    if (!protocol) {
      return { error: 'Unable to fetch network stats from Livepeer subgraph.' };
    }

    const totalActiveStake = parseFloat(protocol['totalActiveStake'] as string) / 1e18;
    const totalSupply = parseFloat(protocol['totalSupply'] as string) / 1e18;
    const participationRate = parseFloat(protocol['participationRate'] as string);

    return {
      active_orchestrators: protocol['numActiveTranscoders'],
      total_active_stake_lpt: totalActiveStake.toFixed(2),
      total_supply_lpt: totalSupply.toFixed(2),
      participation_rate_percent: (participationRate * 100).toFixed(2),
      inflation_rate: protocol['inflation'],
      inflation_change: protocol['inflationChange'],
      round_length: protocol['roundLength'],
    };
  },
});
