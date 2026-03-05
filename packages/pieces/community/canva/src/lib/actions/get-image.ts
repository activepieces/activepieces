import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { canvaAuth } from '../../index';
import { canvaApiRequest } from '../common';

export const getImage = createAction({
  auth: canvaAuth,
  name: 'get_image',
  displayName: 'Get Image',
  description:
    'Retrieve details about an image asset in your Canva library.',
  props: {
    assetId: Property.ShortText({
      displayName: 'Asset ID',
      description: 'The ID of the image asset to retrieve.',
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
