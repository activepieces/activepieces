import { createAction, Property } from '@activepieces/pieces-framework';
import { querySynthetix } from '../common/graphql';

const QUERY = `
  query GetExchanges($first: Int!, $skip: Int!) {
    synthExchanges(
      first: $first
      skip: $skip
      orderBy: timestamp
      orderDirection: desc
    ) {
      id
      account
      fromSynth { symbol }
      toSynth { symbol }
      fromAmount
      toAmount
      toAmountInUSD
      feesInUSD
      timestamp
    }
  }
`;

interface ExchangeData {
  synthExchanges: {
    id: string;
    account: string;
    fromSynth: { symbol: string } | null;
    toSynth: { symbol: string } | null;
    fromAmount: string;
    toAmount: string;
    toAmountInUSD: string;
    feesInUSD: string;
    timestamp: string;
  }[];
}

export const getExchanges = createAction({
  name: 'get_exchanges',
  displayName: 'Get Exchanges',
  description: 'Retrieve recent synthetic asset exchanges and swaps on the Synthetix protocol.',
  auth: undefined,
  props: {
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Number of exchanges to return (1–100).',
      required: false,
      defaultValue: 25,
    }),
    skip: Property.Number({
      displayName: 'Skip',
      description: 'Number of records to skip (for pagination).',
      required: false,
      defaultValue: 0,
    }),
  },
  async run(ctx) {
    const limit = Math.min(Math.max(Number(ctx.propsValue.limit ?? 25), 1), 100);
    const skip = Math.max(Number(ctx.propsValue.skip ?? 0), 0);

    const data = await querySynthetix<ExchangeData>(QUERY, { first: limit, skip });

    return {
      count: data.synthExchanges.length,
      exchanges: data.synthExchanges.map((e) => ({
        id: e.id,
        account: e.account,
        from: e.fromSynth?.symbol ?? 'unknown',
        to: e.toSynth?.symbol ?? 'unknown',
        fromAmount: e.fromAmount,
        toAmount: e.toAmount,
        valueUSD: e.toAmountInUSD,
        feesUSD: e.feesInUSD,
        timestamp: new Date(parseInt(e.timestamp) * 1000).toISOString(),
      })),
    };
  },
});
