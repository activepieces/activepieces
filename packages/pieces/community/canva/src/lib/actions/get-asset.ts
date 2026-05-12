import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { canvaApiCall } from '../common';
import { canvaAuth } from '../auth';

export const getAssetAction = createAction({
  auth: canvaAuth,
  name: 'get_asset',
  displayName: 'Get Asset',
  description: 'Retrieves details about an existing Canva asset (image) by its ID.',
  props: {
    asset_id: Property.ShortText({
      displayName: 'Asset ID',
      description: 'The ID of the asset to retrieve.',
      required: true,
    }),
  },
  async run(context) {
    const { asset_id } = context.propsValue;
    const accessToken = context.auth.access_token;

    return canvaApiCall({
      accessToken,
      method: HttpMethod.GET,
      path: `/assets/${encodeURIComponent(asset_id)}`,
    });
  },
});
