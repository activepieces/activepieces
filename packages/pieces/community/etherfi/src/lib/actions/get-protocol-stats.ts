import { createAction } from '@activepieces/pieces-framework';
import { fetchProtocolData, fetchTokenPrice } from '../etherfi-api';

export const getProtocolStats = createAction({
  name: 'get-protocol-stats',
  displayName: 'Get Protocol Stats',
  description: 'Fetch a combined overview of Ether.fi protocol TVL and ETHFI token price in a single request (parallel fetch).',
  props: {},
  async run() {
    const [protocolData, tokenPrice] = await Promise.all([
      fetchProtocolData(),
      fetchTokenPrice(),
    ]);

    return {
      name: protocolData.name,
      tvl_usd: protocolData.tvl,
      chains: protocolData.chains,
      token: {
        symbol: 'ETHFI',
        price_usd: tokenPrice.price,
        market_cap_usd: tokenPrice.market_cap,
        change_24h_pct: tokenPrice.change_24h,
      },
    };
  },
});
