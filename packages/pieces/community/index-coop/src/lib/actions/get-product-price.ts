import { createAction, Property } from '@activepieces/pieces-framework';

const PRODUCT_MAP = {
  dpi: 'defipulse-index',
  mvi: 'metaverse-index',
  'eth2x-fli': 'eth-2x-flexible-leverage-index',
  iceth: 'interest-compounding-eth-index',
  btc2x: 'btc-2x-flexible-leverage-index',
};

export const getProductPrice = createAction({
  name: 'get_product_price',
  displayName: 'Get Index Product Price',
  description: 'Get price and market data for a specific Index Coop product (DPI, MVI, ETH2X-FLI, etc.)',
  props: {
    product: Property.StaticDropdown({
      displayName: 'Product',
      description: 'Select an Index Coop product token',
      required: true,
      options: {
        options: [
          { label: 'DPI - DeFi Pulse Index', value: 'dpi' },
          { label: 'MVI - Metaverse Index', value: 'mvi' },
          { label: 'ETH2X-FLI - ETH 2x Flexible Leverage Index', value: 'eth2x-fli' },
          { label: 'icETH - Interest Compounding ETH Index', value: 'iceth' },
          { label: 'BTC2X - BTC 2x Flexible Leverage Index', value: 'btc2x' },
        ],
      },
    }),
  },
  async run({ propsValue }) {
    const coinId = PRODUCT_MAP[propsValue.product];
    if (!coinId) {
      throw new Error(`Unknown product: ${propsValue.product}`);
    }

    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/${coinId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false`
    );
    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status} for product ${propsValue.product}`);
    }
    const data = await response.json();
    const market = data.market_data;

    return {
      product: propsValue.product.toUpperCase(),
      symbol: data.symbol?.toUpperCase(),
      name: data.name,
      priceUsd: market?.current_price?.usd ?? 0,
      marketCapUsd: market?.market_cap?.usd ?? 0,
      change24h: market?.price_change_percentage_24h ?? 0,
      change7d: market?.price_change_percentage_7d ?? 0,
      volume24h: market?.total_volume?.usd ?? 0,
      circulatingSupply: market?.circulating_supply ?? 0,
      ath: market?.ath?.usd ?? 0,
      lastUpdated: data.last_updated,
    };
  },
});
