import { createAction, HttpMethod } from '@activepieces/pieces-framework';
import { canvaCommon } from '../common';

export const getImageAction = createAction({
  name: 'get_image',
  displayName: 'Get an Image',
  description: 'Retrieves details about an existing image (asset).',
  props: {
    assetId: canvaCommon.assetId,
  },
  async run(context) {
    const { auth, propsValue } = context;
    const { assetId } = propsValue;

    const response = await canvaCommon.makeRequest(
      auth.access_token,
      HttpMethod.GET,
      `/assets/${assetId}`
    );

    return {
      image: response,
      message: 'Image details retrieved successfully.',
    };
  },
});
