import { createAction } from '@activepieces/pieces-framework';
import { querySynthetix } from '../common/graphql';

const QUERY = `
  query GetStakingStats {
    snxholders(first: 1000, orderBy: collateral, orderDirection: desc) {
      id
      collateral
      balanceOf
      minted
    }
    synthetixes(first: 1) {
      issuers
      snxTotal
      snxStaked
      snxTotalSupply
      percentLocked
      lastModifiedDate
    }
  }
`;

interface StakingData {
  snxholders: {
    id: string;
    collateral: string;
    balanceOf: string;
    minted: string;
  }[];
  synthetixes: {
    issuers: string;
    snxTotal: string;
    snxStaked: string;
    snxTotalSupply: string;
    percentLocked: string;
    lastModifiedDate: string;
  }[];
}

export const getStakingStats = createAction({
  name: 'get_staking_stats',
  displayName: 'Get Staking Stats',
  description: 'Retrieve total SNX staked, collateral ratios, and staking data from the Synthetix protocol.',
  auth: undefined,
  props: {},
  async run() {
    const data = await querySynthetix<StakingData>(QUERY);

    const synthetix = data.synthetixes[0] ?? null;
    const totalHolders = data.snxholders.length;
    const totalCollateral = data.snxholders.reduce(
      (sum, h) => sum + parseFloat(h.collateral || '0'),
      0
    );
    const totalMinted = data.snxholders.reduce(
      (sum, h) => sum + parseFloat(h.minted || '0'),
      0
    );

    return {
      summary: synthetix,
      topHoldersCount: totalHolders,
      aggregatedCollateral: totalCollateral.toFixed(4),
      aggregatedMinted: totalMinted.toFixed(4),
      topHolders: data.snxholders.slice(0, 10),
    };
  },
});
