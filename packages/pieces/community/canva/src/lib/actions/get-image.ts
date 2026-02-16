import { createAction, Property } from '@activepieces/pieces-framework';
import { canvaAuth } from '../../index';
import { canvaApiCall } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const getImageAction = createAction({
  auth: canvaAuth,
  name: 'get_asset',
  displayName: 'Get Asset',
  description: 'Get the metadata of an uploaded asset (image or video)',
  props: {
    assetId: Property.ShortText({
      displayName: 'Asset ID',
      description: 'The ID of the asset to retrieve',
      required: true,
    }),
  },
  async run(context) {
    const { assetId } = context.propsValue;

    const response = await canvaApiCall<{ asset: Record<string, unknown> }>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/assets/${assetId}`,
    });

    return response.asset;
  },
});
