import { propsValidation } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { vlmRunAuth, vlmRunCommon } from '../common';
import { analyzeImageProperties } from '../common/properties';
import { analyzeImageSchema } from '../common/schemas';

export const analyzeImage = createAction({
  auth: vlmRunAuth,
  name: 'analyzeImage',
  displayName: 'Analyze Image',
  description:
    'Process an image (file or URL), extracting descriptions, detecting objects, etc.',
  audience: 'both',
  aiMetadata: { description: 'Analyze an image (passed as a file or URL) with VLM Run, selecting an analysis domain that switches the task between classification, captioning, TV-news parsing, or visual Q&A. Choose this for any single-image visual understanding need. The domain input is required and determines what is extracted; each call launches a new prediction job and polls until complete, so it is not idempotent.', idempotent: false },
  props: analyzeImageProperties,
  async run({ auth: apiKey, propsValue }) {
    await propsValidation.validateZod(propsValue, analyzeImageSchema);

    const { image, domain } = propsValue;


    const response = await vlmRunCommon.analyzeImage({
      apiKey:apiKey.secret_text,
      images: [image],
      domain,
    });

    return await vlmRunCommon.getresponse(apiKey.secret_text, response.id, response.status);
  },
});
