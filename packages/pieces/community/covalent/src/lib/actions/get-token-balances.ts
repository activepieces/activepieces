import { createAction, Property } from '@activepieces/pieces-framework';
import { covalentAuth } from '../..';
import { covalentRequest } from '../common/covalent-api';
import { CHAIN_OPTIONS } from '../common/chain-dropdown';

interface TokenBalance {
  contract_decimals: number;
  contract_name: string;
  contract_ticker_symbol: string;
  contract_address: string;
  balance: string;
  quote: number;
  quote_rate: number;
}

interface TokenBalancesResponse {
  address: string;
  updated_at: string;
  items: TokenBalance[];
}

export const getTokenBalances = createAction({
  name: 'get_token_balances',
  displayName: 'Get Token Balances',
  description:
    'Fetch ERC-20 token balances for a wallet address across 100+ blockchains.',
  auth: covalentAuth,
  requireAuth: true,
  props: {
    wallet_address: Property.ShortText({
      displayName: 'Wallet Address',
      description: 'The wallet address to get token balances for.',
      required: true,
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
    const { wallet_address, chain_name } = propsValue;
    const data = await covalentRequest<TokenBalancesResponse>(
      auth as string,
      `${chain_name}/address/${wallet_address}/balances_v2/`,
      { nft: 'false' }
    );
    return {
      address: data.address,
      updated_at: data.updated_at,
      token_count: data.items.length,
      tokens: data.items,
    };
  },
});
