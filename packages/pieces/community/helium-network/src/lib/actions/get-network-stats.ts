import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';

export const getNetworkStats = createAction({
  name: 'get_network_stats',
  displayName: 'Get Network Stats',
  description: 'Get global Helium Network statistics including total hotspots, countries covered, and circulating supply.',
  props: {},
  async run(_context) {
    const [statsResp, statsV1Resp] = await Promise.all([
      httpClient.sendRequest({
        method: HttpMethod.GET,
        url: 'https://api.helium.io/v1/stats',
      }),
      httpClient.sendRequest({
        method: HttpMethod.GET,
        url: 'https://api.helium.io/v1/hotspots/count',
      }),
    ]);

    const stats = statsResp.body?.data;
    const hotspotCount = statsV1Resp.body?.data;

    return {
      token_supply: stats?.token_supply ? stats.token_supply / 1e8 : null,
      max_supply: 223_000_000,
      hotspot_count: typeof hotspotCount === 'number' ? hotspotCount : null,
      block_height: stats?.block_height ?? null,
      election_period: stats?.election_period ?? null,
      challenge_interval: stats?.challenge_interval ?? null,
      transaction_fee: stats?.transaction_fee ?? null,
    };
  },
});
