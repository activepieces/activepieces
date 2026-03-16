import { createAction, Property } from '@activepieces/pieces-framework';
import { fetchAllFeeds } from '../chainlink-api';

export const searchFeeds = createAction({
  name: 'search_feeds',
  displayName: 'Search Price Feeds',
  description:
    'Search Chainlink price feeds by asset name or pair name (e.g., search "BTC" returns BTC/USD, BTC/ETH, etc.)',
  props: {
    query: Property.ShortText({
      displayName: 'Search Query',
      description: 'Asset name or pair to search for (e.g., "BTC", "ETH", "USD", "LINK")',
      required: true,
    }),
    network: Property.StaticDropdown({
      displayName: 'Network',
      description: 'The blockchain network to search',
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
      displayName: 'Max Results',
      description: 'Maximum number of results to return',
      required: false,
      defaultValue: 20,
    }),
  },
  async run({ propsValue }) {
    const { query, network, limit } = propsValue;
    const feeds = await fetchAllFeeds(network as string);

    const q = (query as string).toUpperCase().trim();
    const maxLimit = Math.min(Number(limit) || 20, 200);

    const matched = feeds
      .filter(
        (f) =>
          f.name?.toUpperCase().includes(q) ||
          f.pair?.toUpperCase().includes(q) ||
          f.assetName?.toUpperCase().includes(q)
      )
      .slice(0, maxLimit);

    return {
      query,
      network,
      totalMatches: matched.length,
      feeds: matched.map((f) => ({
        name: f.name,
        pair: f.pair,
        assetName: f.assetName,
        feedType: f.feedType,
        decimals: f.decimals,
        proxyAddress: f.proxyAddress,
        heartbeatSeconds: f.heartbeat,
        deviationThresholdPercent: f.deviationThreshold,
      })),
    };
  },
});
