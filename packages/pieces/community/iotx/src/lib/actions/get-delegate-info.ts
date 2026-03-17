import { createAction, Property } from '@activepieces/pieces-framework';

const IOTEX_GRAPHQL_URL = 'https://analyser-api.iotex.io/api';

export const getDelegateInfo = createAction({
  name: 'get_delegate_info',
  displayName: 'Get Delegate Info',
  description: 'Get information about a specific IoTeX delegate/validator by name.',
  props: {
    delegate_name: Property.ShortText({
      displayName: 'Delegate Name',
      description: 'The name of the IoTeX delegate (e.g. "iotexlab", "binance").',
      required: true,
    }),
    epoch: Property.Number({
      displayName: 'Epoch (optional)',
      description: 'The epoch number to query. Leave blank for the latest epoch.',
      required: false,
    }),
  },
  async run(context) {
    const { delegate_name, epoch } = context.propsValue;

    const epochParam = epoch ? `, epochNumber: ${epoch}` : '';

    const query = `
      query {
        delegate(delegateName: "${delegate_name}"${epochParam}) {
          bookkeeping {
            exist
          }
          reward {
            exist
            rewardDistribution(pagination: { skip: 0, first: 5 }) {
              voterEthAddress
              amount
            }
          }
          staking {
            selfStaking
            stakingBuckets(pagination: { skip: 0, first: 1 }) {
              count
              stakingBuckets {
                stakedAmount
              }
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
        delegate?: {
          staking?: {
            selfStaking?: string;
            stakingBuckets?: { count?: number };
          };
          bookkeeping?: { exist?: boolean };
        };
      };
      errors?: Array<{ message: string }>;
    };

    if (json.errors?.length) {
      throw new Error(`GraphQL error: ${json.errors[0].message}`);
    }

    const d = json.data?.delegate;

    return {
      delegate_name,
      self_staking_iotx: d?.staking?.selfStaking
        ? (Number(d.staking.selfStaking) / 1e18).toFixed(2)
        : null,
      total_voter_buckets: d?.staking?.stakingBuckets?.count ?? null,
      bookkeeping_active: d?.bookkeeping?.exist ?? null,
      raw: d,
    };
  },
});
