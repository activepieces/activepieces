import { createAction, Property } from '@activepieces/pieces-framework';
import { debankAuth } from '../../index';
import { debankRequest } from '../debank-api';

export const getNftList = createAction({
  name: 'get_nft_list',
  displayName: 'Get NFT List',
  description:
    'Get all NFTs owned by a wallet address across all supported chains.',
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
      '/user/all_nft_list',
      params
    );
    return response.body;
  },
});
