import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';

const SUBGRAPH_URL = 'https://api.thegraph.com/subgraphs/name/synthetixio-team/synthetix-rates';

const GRAPHQL_QUERY = `
  query {
    synthRates(orderBy: timestamp, orderDirection: desc, first: 100) {
      id
      synth
      rate
      timestamp
    }
  }
`;

export const getSynthRates = createAction({
  name: 'get_synth_rates',
  displayName: 'Get Synth Rates',
  description: 'Fetch current exchange rates for sUSD, sBTC, sETH, and other synths',
  props: {},
  async run(context) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: SUBGRAPH_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        query: GRAPHQL_QUERY,
      },
    });

    if (response.status !== 200) {
      throw new Error(`Synthetix API request failed with status ${response.status}`);
    }

    return response.body;
  },
});
