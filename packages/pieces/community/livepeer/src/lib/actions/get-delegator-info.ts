import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getDelegatorInfo = createAction({
  name: 'get_delegator_info',
  displayName: 'Get Delegator Info',
  description: 'Get staking and delegation info for an Ethereum address including stake, rewards, and fees earned.',
  props: {
    address: Property.ShortText({
      displayName: 'ETH Address',
      description: 'The Ethereum address of the delegator (e.g. 0x1234...).',
      required: true,
    }),
  },
  async run(context) {
    const address = context.propsValue.address.toLowerCase();

    const query = `
      {
        delegator(id: "${address}") {
          id
          bondedAmount
          unbondedAmount
          principal
          fees
          startRound
          lastClaimRound {
            id
          }
          delegate {
            id
            active
            totalStake
            rewardCut
            feeShare
          }
          unbondingLocks {
            amount
            withdrawRound
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

    const body = response.body as { data?: { delegator?: Record<string, unknown> | null } };
    const delegator = body?.data?.delegator;

    if (!delegator) {
      return {
        found: false,
        address,
        message: 'No delegator info found for this address. The address may not have staked LPT.',
      };
    }

    const delegate = (delegator['delegate'] as Record<string, unknown>) ?? null;
    const unbondingLocks = (delegator['unbondingLocks'] as Array<Record<string, unknown>>) ?? [];

    return {
      found: true,
      address: delegator['id'],
      bonded_amount_lpt: (parseFloat(delegator['bondedAmount'] as string) / 1e18).toFixed(6),
      unbonded_amount_lpt: (parseFloat(delegator['unbondedAmount'] as string) / 1e18).toFixed(6),
      principal_lpt: (parseFloat(delegator['principal'] as string) / 1e18).toFixed(6),
      fees_earned_eth: (parseFloat(delegator['fees'] as string) / 1e18).toFixed(8),
      start_round: delegator['startRound'],
      last_claim_round: (delegator['lastClaimRound'] as Record<string, unknown>)?.['id'],
      delegate: delegate
        ? {
            address: delegate['id'],
            active: delegate['active'],
            total_stake_lpt: (parseFloat(delegate['totalStake'] as string) / 1e18).toFixed(4),
            reward_cut_percent: (parseInt(delegate['rewardCut'] as string) / 10000).toFixed(2),
            fee_share_percent: (parseInt(delegate['feeShare'] as string) / 10000).toFixed(2),
          }
        : null,
      pending_unbonding: unbondingLocks.map((lock) => ({
        amount_lpt: (parseFloat(lock['amount'] as string) / 1e18).toFixed(6),
        withdraw_round: lock['withdrawRound'],
      })),
    };
  },
});
