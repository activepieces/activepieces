import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { pixelpandaAuth } from '../auth';
import { pixelpandaRequest } from '../common';

export const pixelpandaUpscaleImageAction = createAction({
  auth: pixelpandaAuth,
  name: 'pixelpanda_upscale_image',
  displayName: 'Upscale Image',
  description: 'Increase image resolution 2x, 4x or 8x with AI (1 credit; 8x = 2)',
  props: {
    imageUrl: Property.ShortText({
      displayName: 'Image URL',
      description: 'Public URL of the image (JPEG/PNG/WebP, max 10MB)',
      required: true,
    }),
    scale: Property.StaticDropdown({
      displayName: 'Scale Factor',
      required: true,
      defaultValue: 2,
      options: { options: [ { label: '2x', value: 2 }, { label: '4x', value: 4 }, { label: '8x (2 credits)', value: 8 } ] },
    }),
    quality: Property.StaticDropdown({
      displayName: 'Quality',
      required: false,
      defaultValue: 'fast',
      options: { options: [ { label: 'Fast (Real-ESRGAN)', value: 'fast' }, { label: 'Balanced (Clarity)', value: 'balanced' }, { label: 'High (Clarity max detail)', value: 'high' } ] },
    })
  },
  async run({ auth, propsValue }) {
    return await pixelpandaRequest(
      { secret_text: auth.secret_text },
      HttpMethod.POST,
      '/upscale',
      { image_url: propsValue.imageUrl, scale: propsValue.scale, quality: propsValue.quality ?? 'fast' },
    );
  },
});
