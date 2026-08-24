import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { pixelpandaAuth } from '../auth';
import { pixelpandaRequest } from '../common';

export const pixelpandaRemoveBackgroundAction = createAction({
  auth: pixelpandaAuth,
  name: 'pixelpanda_remove_background',
  displayName: 'Remove Background',
  description: 'Cut out the subject and return a transparent PNG (1 credit)',
  props: {
    imageUrl: Property.ShortText({
      displayName: 'Image URL',
      description: 'Public URL of the image (JPEG/PNG/WebP, max 10MB)',
      required: true,
    })
  },
  async run({ auth, propsValue }) {
    return await pixelpandaRequest(
      { secret_text: auth.secret_text },
      HttpMethod.POST,
      '/remove-background',
      { image_url: propsValue.imageUrl },
    );
  },
});
