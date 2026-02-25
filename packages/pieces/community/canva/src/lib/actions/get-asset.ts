import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { canvaAuth } from '../../index';
import { canvaApiRequest } from '../common';

export const getAsset = createAction({
  auth: canvaAuth,
  name: 'get_asset',
  displayName: 'Get Asset',
  description: 'Retrieve details about an asset (image) in your Canva library.',
  props: {
    assetId: Property.ShortText({
      displayName: 'Asset ID',
      description: 'The ID of the asset to retrieve.',
      required: true,
    }),
  },
  async run(context) {
    return canvaApiRequest(
      context.auth.access_token,
      HttpMethod.GET,
      `/assets/${context.propsValue.assetId}`,
    );
  },
});
