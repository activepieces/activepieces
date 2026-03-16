import { createAction, Property } from '@activepieces/pieces-framework';
import { fetchAllFeeds, fetchRoundHistory, formatPrice } from '../chainlink-api';

export const getFeedHistory = createAction({
  name: 'get_feed_history',
  displayName: 'Get Feed History',
  description: 'Get historical price data (rounds) for a Chainlink price feed',
  props: {
    pair: Property.ShortText({
      displayName: 'Asset Pair',
      description: 'The asset pair (e.g., "ETH / USD", "BTC / USD")',
      required: true,
      defaultValue: 'ETH / USD',
    }),
    network: Property.StaticDropdown({
      displayName: 'Network',
      description: 'The blockchain network',
      required: false,
      defaultValue: 'ethereum-mainnet',
      options: {
        options: [
          { label: 'Ethereum Mainnet', value: 'ethereum-mainnet' },
          { label: 'Arbitrum Mainnet', value: 'arbitrum-mainnet' },
          { label: 'Polygon Mainnet', value: 'polygon-mainnet' },
          { label: 'Optimism Mainnet', value: 'optimism-mainnet' },
          { label: 'Avalanche Mainnet', value: 'avalanche-mainnet' },
          { label: 'BNB Chain Mainnet', value: 'bsc-mainnet' },
        ],
      },
    }),
    limit: Property.Number({
      displayName: 'Number of Rounds',
      description: 'How many historical rounds to fetch (1-100)',
      required: false,
      defaultValue: 10,
    }),
  },
  async run({ propsValue }) {
    const { pair, network, limit } = propsValue;
    const feeds = await fetchAllFeeds(network as string);

    const normalized = (pair as string).toUpperCase().trim();
    const feed = feeds.find(
      (f) =>
        f.name?.toUpperCase() === normalized ||
        f.pair?.toUpperCase() === normalized ||
        f.name?.toUpperCase().replace(/\s/g, '') === normalized.replace(/\s/g, '')
    );

    if (!feed) {
      throw new Error(
        `Price feed "${pair}" not found on ${network}. Use the "List Price Feeds" action to see available feeds.`
      );
    }

    const maxLimit = Math.min(Number(limit) || 10, 100);
    const rounds = await fetchRoundHistory(feed.proxyAddress || feed.contractAddress, maxLimit);

    return {
      pair: feed.name,
      feedAddress: feed.proxyAddress || feed.contractAddress,
      decimals: feed.decimals,
      roundCount: rounds.length,
      rounds: rounds.map((r) => ({
        roundId: r.roundId,
        price: formatPrice(r.answer, feed.decimals),
        rawAnswer: r.answer,
        startedAt: new Date(parseInt(r.startedAt, 10) * 1000).toISOString(),
        updatedAt: new Date(parseInt(r.updatedAt, 10) * 1000).toISOString(),
      })),
    };
  },
});
