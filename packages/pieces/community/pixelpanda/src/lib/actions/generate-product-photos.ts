import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { pixelpandaAuth } from '../auth';
import { pixelpandaRequest } from '../common';

export const pixelpandaGenerateProductPhotosAction = createAction({
  auth: pixelpandaAuth,
  name: 'pixelpanda_generate_product_photos',
  displayName: 'Generate Product Photos',
  description: 'Turn one product image into AI lifestyle/studio scene photos (1 credit per photo); returns a job to poll with Get Generation Job',
  props: {
    imageUrl: Property.ShortText({
      displayName: 'Image URL',
      description: 'Public URL of the image (JPEG/PNG/WebP, max 10MB)',
      required: true,
    }),
    numScenes: Property.Number({
      displayName: 'Number of Photos',
      description: '1-12',
      required: false,
      defaultValue: 4,
    })
  },
  async run({ auth, propsValue }) {
    return await pixelpandaRequest(
      { secret_text: auth.secret_text },
      HttpMethod.POST,
      '/generate/scenes-from-url',
      { image_url: propsValue.imageUrl, num_scenes: propsValue.numScenes ?? 4 },
    );
  },
});
