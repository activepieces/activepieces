import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { pixelpandaAuth } from '../auth';
import { pixelpandaRequest } from '../common';

export const pixelpandaEnhancePhotoAction = createAction({
  auth: pixelpandaAuth,
  name: 'pixelpanda_enhance_photo',
  displayName: 'Enhance Photo',
  description: 'Sharpen, de-noise and fix lighting with AI (1 credit)',
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
      '/enhance',
      { image_url: propsValue.imageUrl },
    );
  },
});
