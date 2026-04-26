import { createAction } from '@activepieces/pieces-framework';
import { OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { canvaAuth } from '../auth';
import { canvaApiRequest, canvaCommon } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const getAsset = createAction({
  auth: canvaAuth,
  name: 'get_asset',
  displayName: 'Get an Image',
  description: 'Retrieve details about a specific asset (image or video) in your Canva library by its asset ID.',
  props: {
    assetId: canvaCommon.assetId,
  },
  async run(context) {
    const { assetId } = context.propsValue;
    const auth = context.auth as OAuth2PropertyValue;

    const response = await canvaApiRequest({
      auth,
      method: HttpMethod.GET,
      path: `/assets/${assetId}`,
    });

    return response;
  },
});
