import { createAction, Property } from '@activepieces/pieces-framework';
import { getTokenList } from '../uniswap-api';

export const getTokenListAction = createAction({
  name: 'get_token_list',
  displayName: 'Get Token List',
  description:
    "Fetch Uniswap's official token list — all tokens supported by the Uniswap interface.",
  props: {
    chainId: Property.StaticDropdown({
      displayName: 'Filter by Chain (optional)',
      description: 'Filter tokens by blockchain network. Leave empty to get all tokens.',
      required: false,
      options: {
        options: [
          { label: 'All Chains', value: 0 },
          { label: 'Ethereum (1)', value: 1 },
          { label: 'Polygon (137)', value: 137 },
          { label: 'Arbitrum (42161)', value: 42161 },
          { label: 'Optimism (10)', value: 10 },
          { label: 'Base (8453)', value: 8453 },
          { label: 'BNB Chain (56)', value: 56 },
        ],
      },
    }),
    search: Property.ShortText({
      displayName: 'Search Symbol or Name (optional)',
      description: 'Filter tokens by symbol or name (case-insensitive)',
      required: false,
    }),
  },
  async run(context) {
    const { chainId, search } = context.propsValue;
    const data = await getTokenList() as { tokens?: Array<{ chainId: number; symbol: string; name: string }> };

    let tokens: Array<{ chainId: number; symbol: string; name: string }> = data?.tokens ?? [];

    // Filter by chain if specified
    if (chainId && Number(chainId) !== 0) {
      tokens = tokens.filter((t) => t.chainId === Number(chainId));
    }

    // Filter by search term if specified
    if (search && search.trim()) {
      const term = search.trim().toLowerCase();
      tokens = tokens.filter(
        (t) =>
          t.symbol?.toLowerCase().includes(term) ||
          t.name?.toLowerCase().includes(term)
      );
    }

    return {
      count: tokens.length,
      tokens,
    };
  },
});
