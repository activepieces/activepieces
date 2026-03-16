import { createAction, Property } from '@activepieces/pieces-framework';
import { COINGECKO_API_BASE } from '../common/paraswap-api';

export const getPspPrice = createAction({
  name: 'get_psp_price',
  displayName: 'Get PSP Token Price',
  description: 'Get PSP token price and market data from CoinGecko',
  props: {
    vsCurrency: Property.StaticDropdown({
      displayName: 'Quote Currency',
      description: 'Currency to quote the price in',
      required: false,
      options: {
        options: [
          { label: 'USD', value: 'usd' },
          { label: 'EUR', value: 'eur' },
          { label: 'BTC', value: 'btc' },
          { label: 'ETH', value: 'eth' },
        ],
      },
      defaultValue: 'usd',
    }),
  },
  async run(context) {
    const { vsCurrency } = context.propsValue;
    const currency = vsCurrency || 'usd';

    const response = await fetch(
      `${COINGECKO_API_BASE}/coins/paraswap?localization=false&tickers=false&community_data=false&developer_data=false`
    );
    const data = await response.json() as any;

    const marketData = data.market_data || {};
    const currencyKey = currency as string;

    return {
      id: data.id,
      symbol: data.symbol,
      name: data.name,
      price: marketData.current_price?.[currencyKey],
      marketCap: marketData.market_cap?.[currencyKey],
      volume24h: marketData.total_volume?.[currencyKey],
      priceChange24h: marketData.price_change_24h,
      priceChangePercentage24h: marketData.price_change_percentage_24h,
      circulatingSupply: marketData.circulating_supply,
      totalSupply: marketData.total_supply,
      ath: marketData.ath?.[currencyKey],
      currency: currencyKey,
      lastUpdated: data.last_updated,
    };
  },
});
