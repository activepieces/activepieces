import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getOrchestratorInfo = createAction({
  name: 'get_orchestrator_info',
  displayName: 'Get Orchestrator Info',
  description: 'Get detailed information about a specific Livepeer orchestrator by ETH address.',
  props: {
    address: Property.ShortText({
      displayName: 'ETH Address',
      description: 'The Ethereum address of the orchestrator (e.g. 0x1234...).',
      required: true,
    }),
  },
  async run(context) {
    const address = context.propsValue.address.toLowerCase();

    const query = `
      {
        transcoder(id: "${address}") {
          id
          active
          totalStake
          rewardCut
          feeShare
          activationRound
          deactivationRound
          totalVolumeETH
          totalVolumeUSD
          pools {
            rewardTokens
            totalStake
            round {
              id
            }
          }
          delegators {
            id
            bondedAmount
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

    const body = response.body as { data?: { transcoder?: Record<string, unknown> | null } };
    const transcoder = body?.data?.transcoder;

    if (!transcoder) {
      return {
        found: false,
        address,
        message: 'No orchestrator found for this address.',
      };
    }

    const delegators = (transcoder['delegators'] as Array<{ id: string; bondedAmount: string }>) ?? [];
    const pools = (transcoder['pools'] as Array<Record<string, unknown>>) ?? [];

    return {
      found: true,
      address: transcoder['id'],
      active: transcoder['active'],
      total_stake_lpt: (parseFloat(transcoder['totalStake'] as string) / 1e18).toFixed(4),
      reward_cut_percent: (parseInt(transcoder['rewardCut'] as string) / 10000).toFixed(2),
      fee_share_percent: (parseInt(transcoder['feeShare'] as string) / 10000).toFixed(2),
      activation_round: transcoder['activationRound'],
      deactivation_round: transcoder['deactivationRound'],
      total_volume_eth: transcoder['totalVolumeETH'],
      total_volume_usd: transcoder['totalVolumeUSD'],
      delegator_count: delegators.length,
      recent_pools: pools.slice(0, 5).map((p) => ({
        round: (p['round'] as Record<string, unknown>)?.['id'],
        reward_tokens: p['rewardTokens'],
        total_stake: (parseFloat(p['totalStake'] as string) / 1e18).toFixed(4),
      })),
    };
  },
});
