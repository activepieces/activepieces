import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { pixelpandaAuth } from '../auth';
import { pixelpandaRequest } from '../common';

export const pixelpandaGenerateUgcVideoAction = createAction({
  auth: pixelpandaAuth,
  name: 'pixelpanda_generate_ugc_video',
  displayName: 'Generate UGC Video',
  description: 'Turn a still image into a talking UGC-style video with native AI speech and lip-sync (50 credits); poll with Get Video Job',
  props: {
    imageUrl: Property.ShortText({
      displayName: 'Image URL',
      description: 'Public URL of the source image to animate (a person or avatar works best)',
      required: true,
    }),
    script: Property.LongText({
      displayName: 'Spoken Script',
      description: 'What the person says',
      required: false,
    })
  },
  async run({ auth, propsValue }) {
    return await pixelpandaRequest(
      { secret_text: auth.secret_text },
      HttpMethod.POST,
      '/generate/video',
      { image_url: propsValue.imageUrl, script: propsValue.script ?? '', duration: 5 },
    );
  },
});
