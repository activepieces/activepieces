import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { pixelpandaAuth } from '../auth';
import { pixelpandaRequest } from '../common';

export const pixelpandaImageToPromptAction = createAction({
  auth: pixelpandaAuth,
  name: 'pixelpanda_image_to_prompt',
  displayName: 'Image to AI Prompts',
  description: 'Describe an image as ready-to-use AI art prompts for Flux, Midjourney and Stable Diffusion (1 credit)',
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
      '/image-to-prompt',
      { image_url: propsValue.imageUrl },
    );
  },
});
