import { createAction, Property } from '@activepieces/pieces-framework';
import { querySynthetix } from '../common/graphql';

const SNAPSHOTS_QUERY = `
  query GetDebtSnapshots($first: Int!) {
    debtSnapshots(first: $first, orderBy: timestamp, orderDirection: desc) {
      id
      timestamp
      debtBalance
      totalIssuedSynths
      totalSupply
    }
  }
`;

const INDIVIDUAL_QUERY = `
  query GetIndividualDebt($account: ID!) {
    debtSnapshot(id: $account) {
      debtBalance
      timestamp
    }
  }
`;

interface SnapshotsData {
  debtSnapshots: {
    id: string;
    timestamp: string;
    debtBalance: string;
    totalIssuedSynths: string;
    totalSupply: string;
  }[];
}

interface IndividualData {
  debtSnapshot: {
    debtBalance: string;
    timestamp: string;
  } | null;
}

export const getDebtSnapshot = createAction({
  name: 'get_debt_snapshot',
  displayName: 'Get Debt Snapshot',
  description: 'Retrieve system-wide debt snapshots and optionally an individual wallet's debt share in Synthetix.',
  auth: undefined,
  props: {
    account: Property.ShortText({
      displayName: 'Wallet Address (optional)',
      description: 'Ethereum address to look up individual debt share (leave blank for system-wide data).',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Snapshot History Limit',
      description: 'Number of historical snapshots to return (1–50).',
      required: false,
      defaultValue: 10,
    }),
  },
  async run(ctx) {
    const limit = Math.min(Math.max(Number(ctx.propsValue.limit ?? 10), 1), 50);
    const account = ctx.propsValue.account?.trim().toLowerCase();

    const snapshotsData = await querySynthetix<SnapshotsData>(SNAPSHOTS_QUERY, {
      first: limit,
    });

    let individualDebt = null;
    if (account) {
      const indData = await querySynthetix<IndividualData>(INDIVIDUAL_QUERY, {
        account,
      });
      individualDebt = indData.debtSnapshot
        ? {
            debtBalance: indData.debtSnapshot.debtBalance,
            asOf: new Date(
              parseInt(indData.debtSnapshot.timestamp) * 1000
            ).toISOString(),
          }
        : { message: 'No debt snapshot found for this address.' };
    }

    return {
      systemSnapshots: snapshotsData.debtSnapshots.map((s) => ({
        id: s.id,
        timestamp: new Date(parseInt(s.timestamp) * 1000).toISOString(),
        debtBalance: s.debtBalance,
        totalIssuedSynths: s.totalIssuedSynths,
        totalSupply: s.totalSupply,
      })),
      individualDebt,
    };
  },
});
