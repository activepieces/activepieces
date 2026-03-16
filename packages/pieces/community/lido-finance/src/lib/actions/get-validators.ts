import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

const LIDO_SUBGRAPH = 'https://api.thegraph.com/subgraphs/name/lidofinance/lido';

export const getValidators = createAction({
  name: 'get_validators',
  displayName: 'Get Node Operators / Validators',
  description: 'Fetch Lido node operators and their validator counts via The Graph subgraph.',
  props: {
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of node operators to return.',
      required: false,
      defaultValue: 20,
    }),
  },
  async run(context) {
    const limit = context.propsValue.limit ?? 20;

    const query = `{
      nodeOperators(first: ${limit}, orderBy: totalSigningKeys, orderDirection: desc) {
        id
        name
        rewardAddress
        totalSigningKeys
        usedSigningKeys
        stoppedValidators
        active
      }
    }`;

    const response = await httpClient.sendRequest<{
      data: {
        nodeOperators: Array<{
          id: string;
          name: string;
          rewardAddress: string;
          totalSigningKeys: string;
          usedSigningKeys: string;
          stoppedValidators: string;
          active: boolean;
        }>;
      };
    }>({
      method: HttpMethod.POST,
      url: LIDO_SUBGRAPH,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });

    const operators = response.body.data?.nodeOperators ?? [];

    return {
      nodeOperators: operators.map((op) => ({
        id: op.id,
        name: op.name,
        rewardAddress: op.rewardAddress,
        totalSigningKeys: Number(op.totalSigningKeys),
        usedSigningKeys: Number(op.usedSigningKeys),
        stoppedValidators: Number(op.stoppedValidators),
        active: op.active,
      })),
      total: operators.length,
    };
  },
});
