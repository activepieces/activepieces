import { createAction, Property } from '@activepieces/pieces-framework';
import { defillamaRequest, apiUrl } from '../common/defillama-api';

interface Protocol {
  name: string;
  slug: string;
  tvl: number;
  chainTvls: Record<string, number>;
  chain: string;
  chains: string[];
  category: string;
  symbol: string;
  change_1h: number | null;
  change_1d: number | null;
  change_7d: number | null;
}

export const getAllProtocols = createAction({
  name: 'get_all_protocols',
  displayName: 'Get All Protocols',
  description:
    'Fetch all DeFi protocols with TVL data, sorted by total value locked.',
  props: {
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of protocols to return.',
      required: false,
      defaultValue: 50,
    }),
    min_tvl: Property.Number({
      displayName: 'Minimum TVL',
      description:
        'Only return protocols with TVL above this value in USD (optional).',
      required: false,
    }),
  },
  async run({ propsValue }) {
    const protocols = await defillamaRequest<Protocol[]>(
      apiUrl('/protocols')
    );

    let filtered = protocols.sort((a, b) => (b.tvl ?? 0) - (a.tvl ?? 0));

    if (propsValue.min_tvl != null) {
      filtered = filtered.filter((p) => (p.tvl ?? 0) >= propsValue.min_tvl!);
    }

    const limit = propsValue.limit ?? 50;
    const results = filtered.slice(0, limit);

    return {
      count: results.length,
      protocols: results.map((p) => ({
        name: p.name,
        slug: p.slug,
        tvl: p.tvl,
        category: p.category,
        symbol: p.symbol,
        chains: p.chains,
        change_1h: p.change_1h,
        change_1d: p.change_1d,
        change_7d: p.change_7d,
      })),
    };
  },
});
