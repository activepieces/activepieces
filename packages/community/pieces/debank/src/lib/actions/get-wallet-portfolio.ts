import { createAction, Property } from '@activepieces/pieces-framework';
import { debankAuth } from '../../index';
import { debankRequest } from '../debank-api';

export const getWalletPortfolio = createAction({
  name: 'get_wallet_portfolio',
  displayName: 'Get Wallet Portfolio',
  description:
    'Get all DeFi protocol positions for a wallet address across 100+ protocols and 30+ chains.',
  auth: debankAuth,
  props: {
    wallet_address: Property.ShortText({
      displayName: 'Wallet Address',
      description: 'The EVM wallet address to look up (e.g. 0xabc...)',
      required: true,
    }),
    chain_ids: Property.ShortText({
      displayName: 'Chain IDs (optional)',
      description:
        'Comma-separated list of chain IDs to filter by (e.g. eth,bsc,matic). Leave blank for all chains.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const params: Record<string, string> = {
      id: propsValue.wallet_address,
    };
    if (propsValue.chain_ids && propsValue.chain_ids.trim() !== '') {
      params['chain_ids'] = propsValue.chain_ids.trim();
    }
    const response = await debankRequest(
      auth as string,
      '/user/all_complex_protocol_list',
      params
    );
    return response.body;
  },
});
