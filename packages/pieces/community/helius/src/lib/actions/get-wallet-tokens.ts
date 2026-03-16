import { createAction, Property } from '@activepieces/pieces-framework';
import { heliusAuth } from '../..';
import { heliusRestRequest } from '../common/helius-api';

interface BalancesResponse {
  nativeBalance: number;
  tokens: {
    mint: string;
    amount: number;
    decimals: number;
    tokenAccount: string;
  }[];
}

export const getWalletTokens = createAction({
  name: 'get_wallet_tokens',
  displayName: 'Get Wallet Tokens',
  description:
    'Get SOL and token balances for any Solana wallet address.',
  auth: heliusAuth,
  requireAuth: true,
  props: {
    wallet_address: Property.ShortText({
      displayName: 'Wallet Address',
      description: 'The Solana wallet address to get balances for.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const data = await heliusRestRequest<BalancesResponse>(
      auth as string,
      `/addresses/${propsValue.wallet_address}/balances`
    );

    return {
      native_balance_lamports: data.nativeBalance,
      native_balance_sol: data.nativeBalance / 1e9,
      token_count: data.tokens.length,
      tokens: data.tokens,
    };
  },
});
