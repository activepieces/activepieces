import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

const SUBGRAPH_URL = 'https://api.thegraph.com/subgraphs/name/synthetixio-team/synthetix';

const GRAPHQL_QUERY = (first: number) => `
  query {
    snxholders(orderBy: collateral, orderDirection: desc, first: ${first}) {
      id
      address
      collateral
      debt
      collateralRatio
      lastUpdated
    }
  }
`;

export const getSnxStakers = createAction({
  name: 'get_snx_stakers',
  displayName: 'Get SNX Stakers',
  description: 'Fetch top SNX stakers with collateral ratio and debt information',
  props: {
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Number of stakers to fetch (max 100)',
      required: false,
      defaultValue: 10,
    }),
  },
  async run(context) {
    const limit = Math.min(context.propsValue.limit || 10, 100);
    
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: SUBGRAPH_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        query: GRAPHQL_QUERY(limit),
      },
    });

    if (response.status !== 200) {
      throw new Error(`Synthetix API request failed with status ${response.status}`);
    }

    return response.body;
  },
});
