import { createAction, Property } from '@activepieces/pieces-framework';
import { fetchAllFeeds, formatPrice } from '../chainlink-api';

export const getPriceFeed = createAction({
  name: 'get_price_feed',
  displayName: 'Get Price Feed',
  description: 'Get the latest price for a specific Chainlink asset pair (e.g., ETH / USD)',
  props: {
    pair: Property.ShortText({
      displayName: 'Asset Pair',
      description:
        'The asset pair to look up (e.g., "ETH / USD", "BTC / USD", "LINK / USD"). Use the exact format from Chainlink.',
      required: true,
      defaultValue: 'ETH / USD',
    }),
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

    const formattedPrice =
      feed.latestAnswer !== undefined
        ? formatPrice(feed.latestAnswer, feed.decimals)
        : null;

    return {
      pair: feed.name,
      assetName: feed.assetName,
      feedType: feed.feedType,
      price: formattedPrice,
      rawAnswer: feed.latestAnswer,
      decimals: feed.decimals,
      contractAddress: feed.contractAddress,
      proxyAddress: feed.proxyAddress,
      networkName: feed.networkName,
      lastUpdated: feed.latestTimestamp
        ? new Date(feed.latestTimestamp * 1000).toISOString()
        : null,
      heartbeatSeconds: feed.heartbeat,
      deviationThresholdPercent: feed.deviationThreshold,
    };
  },
});
