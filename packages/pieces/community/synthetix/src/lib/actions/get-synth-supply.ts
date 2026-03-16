import { createAction, Property } from '@activepieces/pieces-framework';
import { querySynthetix } from '../common/graphql';

const QUERY = `
  query GetSynthSupply($first: Int!) {
    synths(first: $first, orderBy: totalSupply, orderDirection: desc) {
      id
      name
      symbol
      totalSupply
      lastModifiedDate
    }
  }
`;

interface SynthData {
  synths: {
    id: string;
    name: string;
    symbol: string;
    totalSupply: string;
    lastModifiedDate: string;
  }[];
}

export const getSynthSupply = createAction({
  name: 'get_synth_supply',
  displayName: 'Get Synth Supply',
  description: 'Retrieve all synthetic assets (synths) and their outstanding supply on Synthetix.',
  auth: undefined,
  props: {
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of synths to return (1–100).',
      required: false,
      defaultValue: 20,
    }),
  },
  async run(ctx) {
    const limit = Math.min(Math.max(Number(ctx.propsValue.limit ?? 20), 1), 100);
    const data = await querySynthetix<SynthData>(QUERY, { first: limit });

    return {
      count: data.synths.length,
      synths: data.synths.map((s) => ({
        id: s.id,
        name: s.name,
        symbol: s.symbol,
        totalSupply: s.totalSupply,
        lastModifiedDate: s.lastModifiedDate
          ? new Date(parseInt(s.lastModifiedDate) * 1000).toISOString()
          : null,
      })),
    };
  },
});
