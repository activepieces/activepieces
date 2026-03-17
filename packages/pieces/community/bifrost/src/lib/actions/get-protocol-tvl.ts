import { createAction } from '@activepieces/pieces-framework';
import { fetchProtocol } from '../bifrost-api';

export const getProtocolTvl = createAction({
  name: 'get_protocol_tvl',
  displayName: 'Get Protocol TVL',
  description: 'Fetch the current Total Value Locked (TVL) for Bifrost Liquid Staking from DeFiLlama.',
  props: {},
  async run() {
    const protocol = await fetchProtocol();

    const tvl = protocol.tvl ?? 0;
    const currentChainTvls = protocol.currentChainTvls ?? {};

    return {
      protocolName: protocol.name,
      symbol: protocol.symbol,
      tvlUSD: tvl,
      tvlFormatted: `$${tvl.toLocaleString('en-US', { maximumFractionDigits: 2 })}`,
      chain: protocol.chain,
      chains: protocol.chains,
      currentChainTvls,
      url: protocol.url,
      fetchedAt: new Date().toISOString(),
    };
  },
});
