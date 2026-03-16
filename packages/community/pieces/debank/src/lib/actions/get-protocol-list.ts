import { createAction, Property } from '@activepieces/pieces-framework';
import { debankAuth } from '../../index';
import { debankRequest } from '../debank-api';

export const getProtocolList = createAction({
  name: 'get_protocol_list',
  displayName: 'Get Used Chain List',
  description:
    'Get all blockchain networks (chains) that a wallet address has interacted with.',
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
    };
    const response = await debankRequest(
      auth as string,
      '/user/used_chain_list',
      params
    );
    return response.body;
  },
});
