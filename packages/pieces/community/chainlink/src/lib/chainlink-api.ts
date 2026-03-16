import { HttpMethod, httpClient } from '@activepieces/pieces-common';

// Chainlink Data Feeds API base URL
const CHAINLINK_API_BASE = 'https://reference-data-directory.vercel.app';

// The Graph subgraph endpoint for Chainlink price feeds
const GRAPH_ENDPOINT =
  'https://api.thegraph.com/subgraphs/name/smartcontractkit/chainlink-feeds-mainnet';

export interface PriceFeed {
  name: string;
  pair: string;
  assetName: string;
  feedType: string;
  decimals: number;
  contractAddress: string;
  proxyAddress: string;
  heartbeat: number;
  deviationThreshold: number;
  networkName: string;
  docs: {
    assetName?: string;
    feedType?: string;
  };
  latestAnswer?: string;
  latestTimestamp?: number;
}

export interface GraphFeed {
  id: string;
  name: string;
  decimals: number;
  latestAnswer: string;
  latestTimestamp: string;
  assetName: string;
}

export interface RoundData {
  roundId: string;
  answer: string;
  startedAt: string;
  updatedAt: string;
  answeredInRound: string;
}

/**
 * Fetch all price feeds from Chainlink reference data directory
 */
export async function fetchAllFeeds(network = 'ethereum-mainnet'): Promise<PriceFeed[]> {
  try {
    const response = await httpClient.sendRequest<PriceFeed[]>({
      method: HttpMethod.GET,
      url: `${CHAINLINK_API_BASE}/feeds/${network}.json`,
    });
    return response.body || [];
  } catch {
    // Fallback to The Graph
    return fetchFeedsFromGraph();
  }
}

/**
 * Fetch feeds from The Graph subgraph
 */
export async function fetchFeedsFromGraph(): Promise<PriceFeed[]> {
  const query = `
    {
      feeds(first: 100, orderBy: name) {
        id
        name
        decimals
        latestAnswer
        latestTimestamp
        assetName
      }
    }
  `;

  const response = await httpClient.sendRequest<{
    data: { feeds: GraphFeed[] };
  }>({
    method: HttpMethod.POST,
    url: GRAPH_ENDPOINT,
    headers: { 'Content-Type': 'application/json' },
    body: { query },
  });

  const feeds = response.body?.data?.feeds || [];
  return feeds.map((f) => graphFeedToPriceFeed(f));
}

function graphFeedToPriceFeed(f: GraphFeed): PriceFeed {
  return {
    name: f.name,
    pair: f.name,
    assetName: f.assetName || f.name.split(' / ')[0] || '',
    feedType: 'Price',
    decimals: f.decimals,
    contractAddress: f.id,
    proxyAddress: f.id,
    heartbeat: 3600,
    deviationThreshold: 0.5,
    networkName: 'ethereum-mainnet',
    docs: {},
    latestAnswer: f.latestAnswer,
    latestTimestamp: parseInt(f.latestTimestamp, 10),
  };
}

/**
 * Format raw answer based on decimals
 */
export function formatPrice(rawAnswer: string, decimals: number): number {
  const raw = BigInt(rawAnswer);
  const divisor = BigInt(10 ** decimals);
  const whole = raw / divisor;
  const remainder = raw % divisor;
  return parseFloat(`${whole}.${remainder.toString().padStart(decimals, '0')}`);
}

/**
 * Query The Graph for historical rounds
 */
export async function fetchRoundHistory(
  feedId: string,
  limit = 10
): Promise<RoundData[]> {
  const query = `
    {
      rounds(
        where: { feed: "${feedId.toLowerCase()}" }
        first: ${limit}
        orderBy: roundId
        orderDirection: desc
      ) {
        roundId
        answer
        startedAt
        updatedAt
        answeredInRound
      }
    }
  `;

  const response = await httpClient.sendRequest<{
    data: { rounds: RoundData[] };
  }>({
    method: HttpMethod.POST,
    url: GRAPH_ENDPOINT,
    headers: { 'Content-Type': 'application/json' },
    body: { query },
  });

  return response.body?.data?.rounds || [];
}

/**
 * Get a single feed by name (case-insensitive search)
 */
export async function findFeedByName(pairName: string): Promise<PriceFeed | null> {
  const feeds = await fetchAllFeeds();
  const normalized = pairName.toUpperCase().replace(/\s+/g, ' ').trim();

  const found = feeds.find(
    (f) =>
      f.name.toUpperCase() === normalized ||
      f.pair?.toUpperCase() === normalized ||
      f.name.toUpperCase().includes(normalized)
  );

  return found || null;
}
