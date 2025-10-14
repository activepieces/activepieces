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
  props: analyzeImageProperties,
  async run({ auth: apiKey, propsValue }) {
    await propsValidation.validateZod(propsValue, analyzeImageSchema);

    const { image, domain } = propsValue;


    const response = await vlmRunCommon.analyzeImage({
      apiKey,
      images: [image],
      domain,
    });

    return await vlmRunCommon.getresponse(apiKey, response.id, response.status);
  },
});
