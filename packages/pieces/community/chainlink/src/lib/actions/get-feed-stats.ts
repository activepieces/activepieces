import { createAction, Property } from '@activepieces/pieces-framework';
import { fetchAllFeeds, formatPrice } from '../chainlink-api';

export const getFeedStats = createAction({
  name: 'get_feed_stats',
  displayName: 'Get Feed Stats',
  description:
    'Get detailed statistics for a Chainlink price feed, including deviation threshold, heartbeat, and current price',
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
  },
  async run({ propsValue }) {
    const { pair, network } = propsValue;
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

    const currentPrice =
      feed.latestAnswer !== undefined
        ? formatPrice(feed.latestAnswer, feed.decimals)
        : null;

    const lastUpdated = feed.latestTimestamp
      ? new Date(feed.latestTimestamp * 1000)
      : null;
    const now = new Date();
    const staleness = lastUpdated
      ? Math.floor((now.getTime() - lastUpdated.getTime()) / 1000)
      : null;

    return {
      pair: feed.name,
      assetName: feed.assetName,
      feedType: feed.feedType,
      networkName: feed.networkName,
      currentPrice,
      decimals: feed.decimals,
      contractAddress: feed.contractAddress,
      proxyAddress: feed.proxyAddress,
      heartbeatSeconds: feed.heartbeat,
      heartbeatHuman: feed.heartbeat
        ? `${Math.round(feed.heartbeat / 3600)}h`
        : 'N/A',
      deviationThresholdPercent: feed.deviationThreshold,
      lastUpdated: lastUpdated ? lastUpdated.toISOString() : null,
      dataAgeSeconds: staleness,
      isStale:
        staleness !== null && feed.heartbeat
          ? staleness > feed.heartbeat * 1.5
          : null,
    };
  },
});
