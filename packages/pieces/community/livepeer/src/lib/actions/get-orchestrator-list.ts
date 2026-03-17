import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getOrchestratorList = createAction({
  name: 'get_orchestrator_list',
  displayName: 'Get Orchestrator List',
  description: 'List top active orchestrators (video miners) on the Livepeer network.',
  props: {
    limit: Property.Number({
      displayName: 'Number of Orchestrators',
      description: 'How many top orchestrators to return (max 100).',
      required: false,
      defaultValue: 10,
    }),
  },
  async run(context) {
    const limit = Math.min(context.propsValue.limit ?? 10, 100);

    const query = `
      {
        transcoders(
          first: ${limit},
          where: { active: true },
          orderBy: totalStake,
          orderDirection: desc
        ) {
          id
          active
          totalStake
          rewardCut
          feeShare
          activationRound
          lastRewardRound {
            id
          }
        }
      }
    `;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.thegraph.com/subgraphs/name/livepeer/arbitrum-delta',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    });

    const body = response.body as { data?: { transcoders?: Array<Record<string, unknown>> } };
    const transcoders = body?.data?.transcoders ?? [];

    return {
      count: transcoders.length,
      orchestrators: transcoders.map((t) => ({
        address: t['id'],
        active: t['active'],
        total_stake_lpt: (parseFloat(t['totalStake'] as string) / 1e18).toFixed(4),
        reward_cut_percent: (parseInt(t['rewardCut'] as string) / 10000).toFixed(2),
        fee_share_percent: (parseInt(t['feeShare'] as string) / 10000).toFixed(2),
        activation_round: t['activationRound'],
        last_reward_round: (t['lastRewardRound'] as Record<string, unknown>)?.['id'],
      })),
    };
  },
});
