import { createAction, Property } from '@activepieces/pieces-framework';

const IOTEX_GRAPHQL_URL = 'https://analyser-api.iotex.io/api';

export const getStakingInfo = createAction({
  name: 'get_staking_info',
  displayName: 'Get Staking Info',
  description: 'Get staking bucket info for a delegator IoTeX address.',
  props: {
    address: Property.ShortText({
      displayName: 'Delegator Address',
      description: 'The IoTeX address (io1...) to look up staking buckets for.',
      required: true,
    }),
  },
  async run(context) {
    const { address } = context.propsValue;

    const query = `
      query {
        staking {
          stakingBucketsByVoter(
            voterAddress: "${address}"
            pagination: { skip: 0, first: 10 }
          ) {
            count
            stakingBuckets {
              index
              candidateAddress
              stakedAmount
              stakedDuration
              autoStake
              owner
              createTime
              stakeStartTime
            }
          }
        }
      }
    `;

    const response = await fetch(IOTEX_GRAPHQL_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      throw new Error(`IoTeX API error: ${response.status} ${response.statusText}`);
    }

    const json = (await response.json()) as {
      data?: {
        staking?: {
          stakingBucketsByVoter?: {
            count?: number;
            stakingBuckets?: Array<{
              index: number;
              candidateAddress: string;
              stakedAmount: string;
              stakedDuration: number;
              autoStake: boolean;
              owner: string;
            }>;
          };
        };
      };
      errors?: Array<{ message: string }>;
    };

    if (json.errors?.length) {
      throw new Error(`GraphQL error: ${json.errors[0].message}`);
    }

    const result = json.data?.staking?.stakingBucketsByVoter;

    return {
      address,
      total_buckets: result?.count ?? 0,
      buckets: (result?.stakingBuckets ?? []).map((b) => ({
        index: b.index,
        delegate: b.candidateAddress,
        staked_amount_rau: b.stakedAmount,
        staked_amount_iotx: (Number(b.stakedAmount) / 1e18).toFixed(2),
        duration_days: b.stakedDuration,
        auto_stake: b.autoStake,
      })),
    };
  },
});
