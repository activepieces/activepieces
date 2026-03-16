import { createAction, Property } from '@activepieces/pieces-framework';
import { debankAuth } from '../../index';
import { debankRequest } from '../debank-api';

export const getChainBalance = createAction({
  name: 'get_chain_balance',
  displayName: 'Get Chain Balance',
  description:
    'Get the total USD balance of a wallet address on a specific blockchain.',
  auth: debankAuth,
  props: {
    wallet_address: Property.ShortText({
      displayName: 'Wallet Address',
      description: 'The EVM wallet address to look up (e.g. 0xabc...)',
      required: true,
    }),
    chain_id: Property.ShortText({
      displayName: 'Chain ID',
      description:
        'The chain ID to query (e.g. eth, bsc, matic, arb, op, avax, ftm, cro, gnosis)',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const params: Record<string, string> = {
      id: propsValue.wallet_address,
      chain_id: propsValue.chain_id,
    };
    const response = await debankRequest(
      auth as string,
      '/user/chain_balance',
      params
    );
    return response.body;
  },
});
