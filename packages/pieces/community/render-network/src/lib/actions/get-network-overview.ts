import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

interface CoinGeckoCoinInfo {
  id: string;
  symbol: string;
  name: string;
  description: Record<string, string>;
  links: {
    homepage: string[];
    blockchain_site: string[];
    official_forum_url: string[];
    chat_url: string[];
    announcement_url: string[];
    twitter_screen_name: string;
    telegram_channel_identifier: string;
    subreddit_url: string;
    repos_url: { github: string[] };
  };
  categories: string[];
  genesis_date: string | null;
  market_data: {
    current_price: Record<string, number>;
    market_cap: Record<string, number>;
    market_cap_rank: number;
    circulating_supply: number;
    total_supply: number;
  };
}

export const getNetworkOverview = createAction({
  name: 'get_network_overview',
  displayName: 'Get Render Network Overview',
  description:
    'Returns a comprehensive overview of the Render Network including description, use cases, key links, and current token metrics.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest<CoinGeckoCoinInfo>({
      method: HttpMethod.GET,
      url: 'https://api.coingecko.com/api/v3/coins/render-token',
      queryParams: {
        localization: 'false',
        tickers: 'false',
        community_data: 'false',
        developer_data: 'false',
        sparkline: 'false',
      },
    });

    const data = response.body;
    const md = data.market_data;

    // Strip HTML tags from description
    const rawDescription = data.description['en'] ?? '';
    const description = rawDescription.replace(/<[^>]+>/g, '').trim();

    return {
      name: data.name,
      symbol: data.symbol.toUpperCase(),
      categories: data.categories,
      genesis_date: data.genesis_date,
      description: description.slice(0, 1000),
      use_cases: [
        '3D rendering for studios and artists',
        'AI and machine learning compute',
        'Motion graphics and visual effects',
        'Decentralized GPU marketplace',
        'Node operators earning RENDER rewards',
      ],
      key_metrics: {
        price_usd: md.current_price['usd'],
        market_cap_usd: md.market_cap['usd'],
        market_cap_rank: md.market_cap_rank,
        circulating_supply: md.circulating_supply,
        total_supply: md.total_supply,
      },
      links: {
        homepage: data.links.homepage[0] ?? '',
        twitter: data.links.twitter_screen_name
          ? `https://twitter.com/${data.links.twitter_screen_name}`
          : '',
        telegram: data.links.telegram_channel_identifier
          ? `https://t.me/${data.links.telegram_channel_identifier}`
          : '',
        subreddit: data.links.subreddit_url ?? '',
        github: data.links.repos_url.github[0] ?? '',
        blockchain_explorers: data.links.blockchain_site.filter(Boolean).slice(0, 3),
      },
      network: 'Solana (migrated from Ethereum)',
      token_standard: 'SPL (Solana Program Library)',
    };
  },
});
