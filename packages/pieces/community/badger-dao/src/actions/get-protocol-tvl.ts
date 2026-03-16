import { createAction } from '@activepieces/pieces-framework';
import { getProtocolTvl as fetchProtocolTvl } from '../badger-api';

export const getProtocolTvl = createAction({
  name: 'get_protocol_tvl',
  displayName: 'Get Protocol TVL',
  description: 'Fetches the current total value locked (TVL) for Badger DAO across all chains from DeFiLlama.',
  props: {},
  async run() {
    const data = await fetchProtocolTvl();
    return {
      name: data.name,
      tvl: data.currentChainTvls,
      totalTvl: Object.values(data.currentChainTvls || {}).reduce(
        (sum: number, val: any) => sum + (typeof val === 'number' ? val : 0),
        0
      ),
      description: data.description,
      category: data.category,
      chains: data.chains,
      twitter: data.twitter,
      url: data.url,
    };
  },
});
