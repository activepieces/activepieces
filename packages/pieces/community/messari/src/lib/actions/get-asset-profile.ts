import { createAction, Property } from '@activepieces/pieces-framework';
import { messariAuth } from '../../index';
import { messariRequest } from '../common/messari-api';

export const getAssetProfile = createAction({
  auth: messariAuth,
  name: 'get_asset_profile',
  displayName: 'Get Asset Profile',
  description: 'Get the deep research profile of a crypto asset — overview, technology, tokenomics, team, and governance.',
  props: {
    asset_key: Property.ShortText({
      displayName: 'Asset Key',
      description: 'Asset slug or symbol (e.g. "bitcoin", "ethereum", "solana")',
      required: true,
      defaultValue: 'ethereum',
    }),
  },
  async run(context) {
    return messariRequest(context.auth, 'v2', `/assets/${context.propsValue.asset_key}/profile`);
  },
});
