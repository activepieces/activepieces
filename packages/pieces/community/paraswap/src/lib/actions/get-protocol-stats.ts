import { createAction, Property } from '@activepieces/pieces-framework';
import { DEFILLAMA_API_BASE, COINGECKO_API_BASE } from '../common/paraswap-api';

export const getProtocolStats = createAction({
  name: 'get_protocol_stats',
  displayName: 'Get Protocol Stats',
  description: 'Get combined ParaSwap protocol stats: TVL, PSP price, market cap, and chain breakdown',
  props: {},
  async run(context) {
    const [llamaResponse, geckoResponse] = await Promise.all([
      fetch(`${DEFILLAMA_API_BASE}/protocol/paraswap`),
      fetch(`${COINGECKO_API_BASE}/coins/paraswap?localization=false&tickers=false&community_data=false&developer_data=false`),
    ]);

    const llamaData = await llamaResponse.json() as any;
    const geckoData = await geckoResponse.json() as any;

    const marketData = geckoData.market_data || {};
    const chains = llamaData.chains || [];

    return {
      protocol: {
        name: llamaData.name,
        category: llamaData.category,
        chains,
        chainCount: chains.length,
        totalTvl: llamaData.tvl,
        url: llamaData.url,
      },
      pspToken: {
        symbol: geckoData.symbol?.toUpperCase(),
        price: marketData.current_price?.usd,
        marketCap: marketData.market_cap?.usd,
        volume24h: marketData.total_volume?.usd,
        priceChange24h: marketData.price_change_percentage_24h,
        circulatingSupply: marketData.circulating_supply,
      },
    };
  },
});
