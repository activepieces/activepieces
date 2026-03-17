import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

interface SolscanHolderEntry {
  address: string;
  amount: number;
  decimals: number;
  owner: string;
  rank: number;
}

interface SolscanHoldersResponse {
  data: SolscanHolderEntry[];
  total: number;
}

// RENDER token mint address on Solana
const RENDER_TOKEN_MINT = 'rndrizKT3MK1iimdxRdWabcF7Zg7AR5T4nud4EkHBof';

export const getTokenHolders = createAction({
  name: 'get_token_holders',
  displayName: 'Get RENDER Top Token Holders',
  description:
    'Fetches the top RENDER token holders on Solana via the Solscan public API.',
  props: {
    limit: Property.StaticDropdown({
      displayName: 'Number of Holders',
      description: 'How many top holders to return.',
      required: true,
      defaultValue: '10',
      options: {
        options: [
          { label: 'Top 10', value: '10' },
          { label: 'Top 20', value: '20' },
          { label: 'Top 50', value: '50' },
        ],
      },
    }),
  },
  async run(context) {
    const limit = Number(context.propsValue.limit);

    const response = await httpClient.sendRequest<SolscanHoldersResponse>({
      method: HttpMethod.GET,
      url: `https://public-api.solscan.io/token/holders`,
      queryParams: {
        tokenAddress: RENDER_TOKEN_MINT,
        limit: String(limit),
        offset: '0',
      },
      headers: {
        'User-Agent': 'activepieces-render-network-piece/0.0.1',
      },
    });

    const data = response.body;
    const holders = Array.isArray(data.data) ? data.data : [];

    const totalCirculating = holders.reduce((sum, h) => {
      const adjusted = h.amount / Math.pow(10, h.decimals ?? 9);
      return sum + adjusted;
    }, 0);

    const formattedHolders = holders.map((h) => {
      const adjustedAmount = h.amount / Math.pow(10, h.decimals ?? 9);
      const pct = totalCirculating > 0 ? (adjustedAmount / totalCirculating) * 100 : 0;
      return {
        rank: h.rank,
        address: h.address,
        owner: h.owner ?? h.address,
        amount: adjustedAmount,
        percentage_of_top_holders: Number(pct.toFixed(4)),
        explorer_url: `https://solscan.io/account/${h.owner ?? h.address}`,
      };
    });

    return {
      token_mint: RENDER_TOKEN_MINT,
      token_symbol: 'RENDER',
      network: 'Solana',
      holders: formattedHolders,
      holders_returned: formattedHolders.length,
      total_holders_on_chain: data.total ?? null,
    };
  },
});
