import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { canvaAuth } from '../..';
import { canvaCommon } from '../common';

export const getImage = createAction({
  auth: canvaAuth,
  name: 'get_image',
  displayName: 'Get an Image',
  description: 'Retrieve details about an existing image asset in Canva.',
  props: {
    asset_id: Property.ShortText({
      displayName: 'Asset ID',
      description: 'The ID of the image asset to retrieve.',
      required: true,
    }),
  },
  async run(context) {
    return await canvaCommon.makeRequest(
      context.auth,
      HttpMethod.GET,
      `/assets/${context.propsValue.asset_id}`,
    );
  },
});
