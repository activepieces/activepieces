import { createAction, Property } from '@activepieces/pieces-framework';
import { birdeyeAuth } from '../../index';
import { birdeyeRequest } from '../common/birdeye-api';
import { CHAIN_OPTIONS } from '../common/chain-dropdown';

export const getTokenSecurity = createAction({
  auth: birdeyeAuth,
  name: 'get_token_security',
  displayName: 'Get Token Security',
  description: 'Retrieve security audit data for a token: mint authority, freeze authority, ownership details, and risk indicators.',
  props: {
    address: Property.ShortText({
      displayName: 'Token Address',
      description: 'The token contract address (or mint address for Solana)',
      required: true,
    }),
    chain: Property.StaticDropdown({
      displayName: 'Chain',
      description: 'The blockchain network to query',
      required: true,
      options: { options: CHAIN_OPTIONS },
      defaultValue: 'solana',
    }),
  },
  async run(context) {
    return birdeyeRequest(context.auth, '/defi/token_security', context.propsValue.chain as string, {
      address: context.propsValue.address,
    });
  },
});
