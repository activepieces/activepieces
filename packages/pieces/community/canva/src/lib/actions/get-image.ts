import { createAction, Property } from '@activepieces/pieces-framework';
import { canvaAuth } from '../../index';
import { canvaApiCall } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { CanvaAsset } from '../common/types';

export const getImageAction = createAction({
  auth: canvaAuth,
  name: 'get_image',
  displayName: 'Get Asset',
  description: 'Get metadata for an uploaded asset (image or video)',
  props: {
    assetId: Property.ShortText({
      displayName: 'Asset ID',
      description: 'The ID of the asset to retrieve',
      required: true,
    }),
  },
  async run(context) {
    const { assetId } = context.propsValue;

    // Endpoint is GET /assets/{assetId} (not /asset-uploads/{assetId})
    const response = await canvaApiCall<{ asset: CanvaAsset }>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/assets/${assetId}`,
    });

    return response.asset;
  },
});
