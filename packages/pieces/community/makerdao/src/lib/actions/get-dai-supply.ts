import { createAction } from '@activepieces/pieces-framework';
import { fetchCurrentStats, fetchTheGraphQuery } from '../common/makerdao-api';

const SUPPLY_QUERY = `{
  collateralTypes(first: 50, orderBy: totalDebt, orderDirection: desc) {
    id
    totalDebt
    debtCeiling
    liquidationRatio
  }
}`;

export const getDaiSupply = createAction({
  name: 'get_dai_supply',
  displayName: 'Get DAI Supply',
  description: 'Fetch DAI supply breakdown by collateral type via The Graph Maker Protocol subgraph.',
  props: {},
  async run() {
    const [stats, graphData] = await Promise.allSettled([
      fetchCurrentStats(),
      fetchTheGraphQuery(SUPPLY_QUERY),
    ]);

    const totalSupply = stats.status === 'fulfilled' ? stats.value.dai_supply : null;

    let collaterals: Array<{ ilk: string; totalDebt: string; debtCeiling: string; liquidationRatio: string; sharePercent: string }> = [];
    if (graphData.status === 'fulfilled') {
      const gd = graphData.value as { data?: { collateralTypes?: Array<{ id: string; totalDebt: string; debtCeiling: string; liquidationRatio: string }> } };
      const types = gd?.data?.collateralTypes ?? [];
      const totalDebtSum = types.reduce((s: number, t) => s + parseFloat(t.totalDebt || '0'), 0);
      collaterals = types.map((t) => {
        const debt = parseFloat(t.totalDebt || '0');
        const ceiling = parseFloat(t.debtCeiling || '0');
        return {
          ilk: t.id,
          totalDebt: formatDai(debt),
          debtCeiling: formatDai(ceiling),
          liquidationRatio: `${(parseFloat(t.liquidationRatio || '0') * 100).toFixed(0)}%`,
          sharePercent: totalDebtSum > 0 ? `${((debt / totalDebtSum) * 100).toFixed(2)}%` : '0%',
        };
      });
    }

    return {
      totalDaiSupply: totalSupply,
      totalDaiSupplyFormatted: totalSupply ? formatDai(totalSupply) : 'N/A',
      collateralBreakdown: collaterals,
      collateralCount: collaterals.length,
      dataSource: graphData.status === 'fulfilled' ? 'TheGraph + MakerBurn' : 'MakerBurn only',
    };
  },
});

function formatDai(value: number): string {
  if (!value || value === 0) return '0 DAI';
  const b = value / 1e9;
  if (b >= 1) return `${b.toFixed(2)}B DAI`;
  const m = value / 1e6;
  if (m >= 1) return `${m.toFixed(2)}M DAI`;
  const k = value / 1e3;
  if (k >= 1) return `${k.toFixed(2)}K DAI`;
  return `${value.toLocaleString()} DAI`;
}
