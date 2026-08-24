import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { pixelpandaAuth } from '../auth';
import { pixelpandaRequest } from '../common';

export const pixelpandaEditImageAction = createAction({
  auth: pixelpandaAuth,
  name: 'pixelpanda_edit_image',
  displayName: 'Edit Image With AI',
  description: 'Change an image with a text instruction using FLUX Kontext (2 credits)',
  props: {
    imageUrl: Property.ShortText({
      displayName: 'Image URL',
      description: 'Public URL of the image (JPEG/PNG/WebP, max 10MB)',
      required: true,
    }),
    prompt: Property.LongText({
      displayName: 'Prompt',
      description: "What to change, e.g. 'make the car yellow'",
      required: true,
    })
  },
  async run({ auth, propsValue }) {
    return await pixelpandaRequest(
      { secret_text: auth.secret_text },
      HttpMethod.POST,
      '/edit',
      { image_url: propsValue.imageUrl, prompt: propsValue.prompt },
    );
  },
});
