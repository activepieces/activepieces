import { createAction } from '@activepieces/pieces-framework';

export const getProtocolStats = createAction({
  name: 'get_protocol_stats',
  displayName: 'Get Protocol Stats',
  description: 'Get combined Ribbon Finance stats including TVL, RBN price, and market cap',
  props: {},
  async run() {
    const [llamaResponse, geckoResponse] = await Promise.all([
      fetch('https://api.llama.fi/protocol/ribbon-finance'),
      fetch(
        'https://api.coingecko.com/api/v3/coins/ribbon-finance?localization=false&tickers=false&community_data=false&developer_data=false&sparkline=false'
      ),
    ]);

    if (!llamaResponse.ok) {
      throw new Error(`DeFiLlama API error: ${llamaResponse.status} ${llamaResponse.statusText}`);
    }
    if (!geckoResponse.ok) {
      throw new Error(`CoinGecko API error: ${geckoResponse.status} ${geckoResponse.statusText}`);
    }

    const [llamaData, geckoData] = await Promise.all([llamaResponse.json(), geckoResponse.json()]);

    const market = geckoData.market_data;

    return {
      protocol: {
        name: llamaData.name,
        category: llamaData.category,
        description: llamaData.description,
        url: llamaData.url,
        tvl: llamaData.tvl,
        chains: Object.keys(llamaData.currentChainTvls || {}),
      },
      token: {
        symbol: geckoData.symbol?.toUpperCase(),
        price_usd: market?.current_price?.usd,
        market_cap_usd: market?.market_cap?.usd,
        price_change_24h_percent: market?.price_change_percentage_24h,
        total_volume_usd: market?.total_volume?.usd,
        circulating_supply: market?.circulating_supply,
      },
      timestamp: new Date().toISOString(),
    };
  },
});
