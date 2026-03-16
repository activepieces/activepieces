import { createAction, Property } from '@activepieces/pieces-framework';
import { covalentAuth } from '../..';
import { covalentRequest } from '../common/covalent-api';
import { CHAIN_OPTIONS } from '../common/chain-dropdown';

interface NftBalance {
  contract_name: string;
  contract_ticker_symbol: string;
  contract_address: string;
  token_id: string;
  token_url: string;
  external_data: Record<string, unknown>;
}

interface NftBalancesResponse {
  address: string;
  updated_at: string;
  items: NftBalance[];
  pagination: {
    has_more: boolean;
    page_number: number;
    page_size: number;
    total_count: number | null;
  };
}

export const getNftBalances = createAction({
  name: 'get_nft_balances',
  displayName: 'Get NFT Balances',
  description:
    'Fetch NFT holdings for a wallet address across 100+ blockchains.',
  auth: covalentAuth,
  requireAuth: true,
  props: {
    wallet_address: Property.ShortText({
      displayName: 'Wallet Address',
      description: 'The wallet address to get NFT balances for.',
      required: true,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of NFTs to return.',
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
    const { wallet_address, limit, chain_name } = propsValue;
    const data = await covalentRequest<NftBalancesResponse>(
      auth as string,
      `${chain_name}/address/${wallet_address}/balances_nft/`,
      { limit: String(limit ?? 10) }
    );
    return {
      address: data.address,
      updated_at: data.updated_at,
      nft_count: data.items.length,
      nfts: data.items,
      pagination: data.pagination,
    };
  },
});
