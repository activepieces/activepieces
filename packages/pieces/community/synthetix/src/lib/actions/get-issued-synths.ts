import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';

const SUBGRAPH_URL = 'https://api.thegraph.com/subgraphs/name/synthetixio-team/synthetix';

const GRAPHQL_QUERY = `
  query {
    issuedSynths(orderBy: amount, orderDirection: desc, first: 50) {
      id
      account
      currencyKey
      amount
      amountUSD
      timestamp
    }
  }
`;

export const getIssuedSynths = createAction({
  name: 'get_issued_synths',
  displayName: 'Get Issued Synths',
  description: 'Fetch total synths issued by type (sUSD, sBTC, sETH, etc.)',
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
