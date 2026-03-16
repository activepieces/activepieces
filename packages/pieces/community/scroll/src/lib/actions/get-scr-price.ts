import { createAction } from '@activepieces/pieces-framework';
import { coinGeckoRequest } from '../scroll-api';

interface CoinGeckoScrollResponse {
  id: string;
  symbol: string;
  name: string;
  market_data: {
    current_price: { usd: number; btc: number; eth: number };
    market_cap: { usd: number };
    total_volume: { usd: number };
    price_change_percentage_24h: number;
    price_change_percentage_7d: number;
    circulating_supply: number;
    total_supply: number;
    ath: { usd: number };
    atl: { usd: number };
  };
}

export const getScrPrice = createAction({
  name: 'get_scr_price',
  displayName: 'Get SCR Token Price',
  description:
    'Fetch the current price, market cap, and 24h volume of the SCR token (Scroll native token) from CoinGecko.',
  props: {},
  async run() {
    const data = await coinGeckoRequest<CoinGeckoScrollResponse>(
      '/coins/scroll?localization=false&tickers=false&community_data=false&developer_data=false'
    );

    const md = data.market_data;
    return {
      token: 'SCR',
      name: data.name,
      priceUsd: md.current_price.usd,
      priceBtc: md.current_price.btc,
      priceEth: md.current_price.eth,
      marketCapUsd: md.market_cap.usd,
      volume24hUsd: md.total_volume.usd,
      priceChange24h: md.price_change_percentage_24h,
      priceChange7d: md.price_change_percentage_7d,
      circulatingSupply: md.circulating_supply,
      totalSupply: md.total_supply,
      athUsd: md.ath.usd,
      atlUsd: md.atl.usd,
    };
  },
});
