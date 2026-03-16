import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

const SUBGRAPH_URL = 'https://api.thegraph.com/subgraphs/name/synthetixio-team/synthetix';

const GRAPHQL_QUERY = (timestamp: number) => `
  query {
    dailyExchangeData(where: {timestamp_gte: ${timestamp}}, orderBy: timestamp, orderDirection: desc, first: 1) {
      id
      timestamp
      exchangeVolumeUSD
      totalFeesUSD
      uniqueTraders
    }
  }
`;

export const getExchangeStats = createAction({
  name: 'get_exchange_stats',
  displayName: 'Get Exchange Stats',
  description: 'Fetch 24h volume, unique traders, and total fees for Synthetix exchange',
  props: {},
  async run(context) {
    // Get data from last 24 hours
    const oneDayAgo = Math.floor(Date.now() / 1000) - 86400;
    
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: SUBGRAPH_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        query: GRAPHQL_QUERY(oneDayAgo),
      },
    });

    if (response.status !== 200) {
      throw new Error(`Synthetix API request failed with status ${response.status}`);
    }

    return response.body;
  },
});
