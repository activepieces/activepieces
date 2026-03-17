import { createAction } from '@activepieces/pieces-framework';
import { fetchProtocolData, formatUsd } from '../stader-api';

export const getProtocolTvl = createAction({
  name: 'get_protocol_tvl',
  displayName: 'Get Protocol TVL',
  description:
    'Fetch the total value locked (TVL) in Stader Labs across all chains from DeFiLlama.',
  auth: undefined,
  props: {},
  async run() {
    const data = await fetchProtocolData();

    const tvl = data.tvl ?? 0;
    const chains = Object.keys(data.currentChainTvls ?? {});

    return {
      name: data.name,
      tvlUsd: tvl,
      tvlFormatted: formatUsd(tvl),
      chains,
      chainCount: chains.length,
      logo: data.logo,
      url: data.url,
    };
  },
});
