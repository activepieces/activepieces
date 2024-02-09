import { Property, createAction } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../..';
import { getAsset } from '../common';

export const getAssetAction = createAction({
  auth: shopifyAuth,
  name: 'get_asset',
  displayName: 'Get Asset',
  description: `Get a theme's asset.`,
  props: {
    key: Property.ShortText({
      displayName: 'Asset Key',
      required: true,
    }),
    themeId: Property.ShortText({
      displayName: 'Theme',
      description: 'The ID of the theme.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { key, themeId } = propsValue;

    return await getAsset(key, +themeId, auth);
  },
});
