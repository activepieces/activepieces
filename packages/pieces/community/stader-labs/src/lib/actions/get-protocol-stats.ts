import { createAction } from '@activepieces/pieces-framework';
import { fetchProtocolData, fetchSdPrice, formatUsd } from '../stader-api';

export const getProtocolStats = createAction({
  name: 'get_protocol_stats',
  displayName: 'Get Protocol Stats',
  description:
    'Fetch combined Stader Labs protocol statistics — TVL and SD token price — in a single parallel call.',
  auth: undefined,
  props: {},
  async run() {
    const [protocolData, priceData] = await Promise.all([
      fetchProtocolData(),
      fetchSdPrice(),
    ]);

    const tvl = protocolData.tvl ?? 0;
    const chains = Object.keys(protocolData.currentChainTvls ?? {});
    const sd = priceData.staderlabs;

    return {
      protocol: {
        name: protocolData.name,
        tvlUsd: tvl,
        tvlFormatted: formatUsd(tvl),
        chainCount: chains.length,
        chains,
        logo: protocolData.logo,
        url: protocolData.url,
      },
      sdToken: {
        symbol: 'SD',
        priceUsd: sd.usd,
        marketCapUsd: sd.usd_market_cap,
        change24hPercent: Number(sd.usd_24h_change.toFixed(2)),
      },
      fetchedAt: new Date().toISOString(),
    };
  },
});
