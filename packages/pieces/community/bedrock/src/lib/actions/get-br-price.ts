import { createAction } from '@activepieces/pieces-framework';
import { fetchBrToken } from '../bedrock-api';

export const getBrPriceAction = createAction({
  name: 'get-br-price',
  displayName: 'Get BR Token Price',
  description:
    'Fetch the current BR governance token price, market cap, 24h volume, and 24h price change from CoinGecko.',
  props: {},
  async run() {
    const token = await fetchBrToken();
    const md = token.market_data;

    return {
      symbol: token.symbol.toUpperCase(),
      name: token.name,
      priceUsd: md.current_price.usd,
      priceFormatted: `$${md.current_price.usd.toFixed(6)}`,
      marketCapUsd: md.market_cap.usd,
      marketCapFormatted: `$${(md.market_cap.usd / 1_000_000).toFixed(2)}M`,
      volume24hUsd: md.total_volume.usd,
      volume24hFormatted: `$${(md.total_volume.usd / 1_000_000).toFixed(2)}M`,
      priceChange24h: md.price_change_percentage_24h,
      priceChange24hFormatted: `${md.price_change_percentage_24h?.toFixed(2)}%`,
      circulatingSupply: md.circulating_supply,
    };
  },
});
