import { createAction, Property } from '@activepieces/pieces-framework';
import { getAtomPrice } from '../lib/cosmos-api';

export const getAtomPriceAction = createAction({
  name: 'get_atom_price',
  displayName: 'Get ATOM Price',
  description:
    'Fetch the current ATOM token price, market cap, and trading volume from CoinGecko.',
  props: {},
  async run() {
    const data = await getAtomPrice();
    const d = data as any;
    return {
      id: d?.id,
      symbol: d?.symbol,
      name: d?.name,
      current_price_usd: d?.market_data?.current_price?.usd,
      market_cap_usd: d?.market_data?.market_cap?.usd,
      total_volume_usd: d?.market_data?.total_volume?.usd,
      price_change_24h: d?.market_data?.price_change_24h,
      price_change_percentage_24h: d?.market_data?.price_change_percentage_24h,
      circulating_supply: d?.market_data?.circulating_supply,
      total_supply: d?.market_data?.total_supply,
      last_updated: d?.last_updated,
    };
  },
});
