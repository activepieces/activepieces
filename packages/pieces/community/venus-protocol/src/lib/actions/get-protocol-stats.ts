import { createAction } from '@activepieces/pieces-framework';
import { getProtocolData, getXvsTokenData } from '../venus-protocol-api';

export const getProtocolStats = createAction({
  name: 'get_protocol_stats',
  displayName: 'Get Protocol Stats',
  description: 'Fetch a combined summary of Venus Protocol metrics (TVL, chains) and XVS token metrics (price, market cap, volume) in one action.',
  props: {},
  async run() {
    const [protocol, token] = await Promise.all([
      getProtocolData(),
      getXvsTokenData(),
    ]);

    const md = token.market_data;

    return {
      protocol: {
        name: protocol.name,
        tvl_usd: protocol.tvl,
        chain: protocol.chain,
        chains: protocol.chains,
        change_1h: protocol.change_1h,
        change_1d: protocol.change_1d,
        change_7d: protocol.change_7d,
        category: protocol.category,
        url: protocol.url,
      },
      token: {
        name: token.name,
        symbol: token.symbol.toUpperCase(),
        price_usd: md.current_price.usd,
        market_cap_usd: md.market_cap.usd,
        volume_24h_usd: md.total_volume.usd,
        price_change_24h_pct: md.price_change_percentage_24h,
        price_change_7d_pct: md.price_change_percentage_7d,
        circulating_supply: md.circulating_supply,
        total_supply: md.total_supply,
      },
    };
  },
});
