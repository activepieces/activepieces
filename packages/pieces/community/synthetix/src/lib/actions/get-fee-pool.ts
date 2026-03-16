import { createAction } from '@activepieces/pieces-framework';
import { querySynthetix } from '../common/graphql';

const QUERY = `
  query GetFeePool {
    feePeriods(first: 5, orderBy: id, orderDirection: desc) {
      id
      feePeriodId
      startTime
      feesToDistribute
      feesClaimed
      rewardsToDistribute
      rewardsClaimed
    }
  }
`;

interface FeePoolData {
  feePeriods: {
    id: string;
    feePeriodId: string;
    startTime: string;
    feesToDistribute: string;
    feesClaimed: string;
    rewardsToDistribute: string;
    rewardsClaimed: string;
  }[];
}

export const getFeePool = createAction({
  name: 'get_fee_pool',
  displayName: 'Get Fee Pool',
  description: 'Retrieve protocol fee pool data including fees earned, distributed, and claimed across recent fee periods.',
  auth: undefined,
  props: {},
  async run() {
    const data = await querySynthetix<FeePoolData>(QUERY);

    return {
      periods: data.feePeriods.map((p) => ({
        feePeriodId: p.feePeriodId,
        startTime: new Date(parseInt(p.startTime) * 1000).toISOString(),
        feesToDistribute: p.feesToDistribute,
        feesClaimed: p.feesClaimed,
        rewardsToDistribute: p.rewardsToDistribute,
        rewardsClaimed: p.rewardsClaimed,
        claimRate:
          parseFloat(p.feesToDistribute) > 0
            ? (
                (parseFloat(p.feesClaimed) /
                  parseFloat(p.feesToDistribute)) *
                100
              ).toFixed(2) + '%'
            : 'N/A',
      })),
    };
  },
});
