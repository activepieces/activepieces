import { createAction, Property } from '@activepieces/pieces-framework';
import { debankAuth } from '../../index';
import { debankRequest } from '../debank-api';

export const getTokenBalances = createAction({
  name: 'get_token_balances',
  displayName: 'Get Token Balances',
  description:
    'Get all token balances for a wallet address, including tokens across all supported chains.',
  auth: debankAuth,
  props: {
    wallet_address: Property.ShortText({
      displayName: 'Wallet Address',
      description: 'The EVM wallet address to look up (e.g. 0xabc...)',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const params: Record<string, string> = {
      id: propsValue.wallet_address,
      is_all: 'true',
    };
    const response = await debankRequest(
      auth as string,
      '/user/all_token_list',
      params
    );
    return response.body;
  },
});
