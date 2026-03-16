import { createAction, Property } from '@activepieces/pieces-framework';
import { defillamaRequest, coinsUrl } from '../common/defillama-api';

interface CoinPrice {
  price: number;
  symbol: string;
  timestamp: number;
  confidence: number;
  decimals?: number;
}

interface PricesResponse {
  coins: Record<string, CoinPrice>;
}

export const getTokenPrices = createAction({
  name: 'get_token_prices',
  displayName: 'Get Token Prices',
  description:
    'Get current USD prices for tokens using DefiLlama price feeds.',
  props: {
    coins: Property.ShortText({
      displayName: 'Coins',
      description:
        'Comma-separated list of coins in format "chain:address" (e.g. "ethereum:0xdF574c24545E5FfEcb9a659c229253D4111d87e1,coingecko:bitcoin").',
      required: true,
    }),
  },
  async run({ propsValue }) {
    const coins = propsValue.coins.trim();
    const data = await defillamaRequest<PricesResponse>(
      coinsUrl(`/prices/current/${coins}`)
    );

    const coins = data.coins ?? {};
    const prices = Object.entries(coins).map(([key, coin]) => ({
      coin: key,
      price: coin.price,
      symbol: coin.symbol,
      timestamp: new Date(coin.timestamp * 1000).toISOString(),
      confidence: coin.confidence,
    }));

    return {
      count: prices.length,
      prices: prices,
    };
  },
});
