import { createAction, Property } from '@activepieces/pieces-framework';
import { coinGeckoRequest } from '../sudoswap-api';

export const getSudoPrice = createAction({
  name: 'get_sudo_price',
  displayName: 'Get SUDO Token Price',
  description:
    'Fetch the current price, market cap, volume, and 24-hour change for the SUDO governance token from CoinGecko.',
  props: {
    vs_currency: Property.StaticDropdown({
      displayName: 'vs Currency',
      description: 'The currency to show price in.',
      required: true,
      defaultValue: 'usd',
      options: {
        options: [
          { label: 'USD', value: 'usd' },
          { label: 'ETH', value: 'eth' },
          { label: 'BTC', value: 'btc' },
          { label: 'EUR', value: 'eur' },
        ],
      },
    }),
  },
  async run({ propsValue }) {
    const { vs_currency } = propsValue;
    const data = await coinGeckoRequest<any>('/coins/sudoswap', {
      localization: 'false',
      tickers: 'false',
      community_data: 'false',
      developer_data: 'false',
    });

    const currency = vs_currency as string;
    const marketData = data.market_data;

    return {
      id: data.id,
      symbol: data.symbol?.toUpperCase(),
      name: data.name,
      price: marketData?.current_price?.[currency],
      marketCap: marketData?.market_cap?.[currency],
      volume24h: marketData?.total_volume?.[currency],
      priceChange24h: marketData?.price_change_percentage_24h,
      priceChange7d: marketData?.price_change_percentage_7d,
      allTimeHigh: marketData?.ath?.[currency],
      allTimeLow: marketData?.atl?.[currency],
      circulatingSupply: marketData?.circulating_supply,
      totalSupply: marketData?.total_supply,
      lastUpdated: data.last_updated,
    };
  },
});
