import { createAction, Property } from '@activepieces/pieces-framework';
import { coingeckoAuth } from '../..';
import { coingeckoRequest } from '../common/coingecko-api';

interface CoinInfo {
  id: string;
  symbol: string;
  name: string;
  description: { en: string };
  links: {
    homepage: string[];
    blockchain_site: string[];
    subreddit_url: string;
    repos_url: { github: string[] };
  };
  market_data: {
    current_price: Record<string, number>;
    market_cap: Record<string, number>;
    total_volume: Record<string, number>;
    price_change_percentage_24h: number;
    market_cap_rank: number;
  };
  genesis_date: string | null;
  categories: string[];
  last_updated: string;
}

export const getCoinInfo = createAction({
  name: 'get_coin_info',
  displayName: 'Get Coin Info',
  description:
    'Get detailed information about a specific cryptocurrency including description, links, and current market data.',
  auth: coingeckoAuth,
  requireAuth: false,
  props: {
    coinId: Property.ShortText({
      displayName: 'Coin ID',
      description: 'CoinGecko coin ID (e.g. bitcoin, ethereum, solana)',
      required: true,
    }),
    localization: Property.Checkbox({
      displayName: 'Include Localization',
      description: 'Include all localized languages in response',
      required: false,
      defaultValue: false,
    }),
  },
  async run({ auth, propsValue }) {
    const localization = propsValue.localization ? 'true' : 'false';

    const data = await coingeckoRequest<CoinInfo>(
      auth as string | undefined,
      `/coins/${encodeURIComponent(propsValue.coinId)}`,
      {
        localization: localization,
        tickers: 'false',
        market_data: 'true',
        community_data: 'false',
        developer_data: 'false',
      }
    );

    return {
      id: data.id,
      symbol: data.symbol,
      name: data.name,
      description: data.description?.en ?? '',
      links: data.links,
      market_data: data.market_data,
      genesis_date: data.genesis_date,
      categories: data.categories,
      last_updated: data.last_updated,
    };
  },
});
