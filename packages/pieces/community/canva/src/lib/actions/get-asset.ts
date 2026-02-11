import { createAction, Property } from '@activepieces/pieces-framework';
import { getAccessTokenOrThrow, HttpMethod } from '@activepieces/pieces-common';
import { canvaAuth } from '../../';
import { callCanvaApi } from '../common';

export const getAsset = createAction({
  auth: canvaAuth,
  name: 'get_asset',
  displayName: 'Get Image',
  description: 'Retrieve details about an existing image asset by its ID.',
  props: {
    asset_id: Property.ShortText({
      displayName: 'Asset ID',
      description: 'The ID of the image asset to retrieve.',
      required: true,
    }),
  },
  async run(context) {
    const { asset_id } = context.propsValue;
    const accessToken = getAccessTokenOrThrow(context.auth);

    const response = await callCanvaApi(
      HttpMethod.GET,
      `assets/${asset_id}`,
      accessToken
    );
    return response.body;
  },
});
