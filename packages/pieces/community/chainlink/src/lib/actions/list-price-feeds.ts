import { createAction, Property } from '@activepieces/pieces-framework';
import { fetchAllFeeds } from '../chainlink-api';

export const listPriceFeeds = createAction({
  name: 'list_price_feeds',
  displayName: 'List Price Feeds',
  description: 'List all available Chainlink price feed pairs for a given network',
  props: {
    network: Property.StaticDropdown({
      displayName: 'Network',
      description: 'The blockchain network to query',
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
    feedType: Property.StaticDropdown({
      displayName: 'Feed Type Filter',
      description: 'Filter by feed type',
      required: false,
      defaultValue: 'all',
      options: {
        options: [
          { label: 'All Feeds', value: 'all' },
          { label: 'Crypto Price Feeds', value: 'Crypto' },
          { label: 'Forex Feeds', value: 'Forex' },
          { label: 'Commodity Feeds', value: 'Commodity' },
        ],
      },
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of feeds to return (1-500)',
      required: false,
      defaultValue: 100,
    }),
  },
  async run({ propsValue }) {
    const { network, feedType, limit } = propsValue;
    let feeds = await fetchAllFeeds(network as string);

    if (feedType && feedType !== 'all') {
      feeds = feeds.filter((f) =>
        f.feedType?.toLowerCase().includes((feedType as string).toLowerCase()) ||
        f.docs?.feedType?.toLowerCase().includes((feedType as string).toLowerCase())
      );
    }

    const maxLimit = Math.min(Number(limit) || 100, 500);
    const sliced = feeds.slice(0, maxLimit);

    return {
      network,
      total: feeds.length,
      returned: sliced.length,
      feeds: sliced.map((f) => ({
        name: f.name,
        pair: f.pair,
        assetName: f.assetName,
        feedType: f.feedType,
        decimals: f.decimals,
        contractAddress: f.contractAddress,
        proxyAddress: f.proxyAddress,
        heartbeatSeconds: f.heartbeat,
        deviationThresholdPercent: f.deviationThreshold,
      })),
    };
  },
});
