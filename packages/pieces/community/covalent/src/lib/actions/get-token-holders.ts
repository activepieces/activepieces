import { createAction, Property } from '@activepieces/pieces-framework';
import { covalentAuth } from '../..';
import { covalentRequest } from '../common/covalent-api';
import { CHAIN_OPTIONS } from '../common/chain-dropdown';

interface TokenHolder {
  address: string;
  balance: string;
  total_supply: string;
  balance_percent_of_total: number;
}

interface TokenHoldersResponse {
  updated_at: string;
  items: TokenHolder[];
  pagination: {
    has_more: boolean;
    page_number: number;
    page_size: number;
    total_count: number | null;
  };
}

export const getTokenHolders = createAction({
  name: 'get_token_holders',
  displayName: 'Get Token Holders',
  description:
    'Fetch a list of token holders for a given contract address across 100+ blockchains.',
  auth: covalentAuth,
  requireAuth: true,
  props: {
    contract_address: Property.ShortText({
      displayName: 'Contract Address',
      description: 'The token contract address to get holders for.',
      required: true,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of holders to return.',
      required: false,
      defaultValue: 10,
    }),
    chain_name: Property.StaticDropdown({
      displayName: 'Chain',
      description: 'The blockchain network to query.',
      required: true,
      defaultValue: 'eth-mainnet',
      options: {
        options: CHAIN_OPTIONS,
      },
    }),
  },
  async run({ auth, propsValue }) {
    const { contract_address, limit, chain_name } = propsValue;
    const data = await covalentRequest<TokenHoldersResponse>(
      auth as string,
      `${chain_name}/tokens/${contract_address}/token_holders_v2/page/0/`,
      { limit: String(limit ?? 10) }
    );
    return {
      updated_at: data.updated_at,
      holder_count: data.items.length,
      holders: data.items,
      pagination: data.pagination,
    };
  },
});
