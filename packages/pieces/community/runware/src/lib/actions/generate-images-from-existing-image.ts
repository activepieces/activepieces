import { propsValidation } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { runwareAuth, runwareCommon } from '../common';

export const generateImagesFromExistingImage = createAction({
  auth: runwareAuth,
  name: 'generateImagesFromExistingImage',
  displayName: 'Generate Images from Existing Image',
  description: 'Generate new images based on a provided image (image-to-image).',
  props: runwareCommon.generateImagesFromExistingImageProperties,
  async run({ auth: apiKey, propsValue }) {
    await propsValidation.validateZod(
      propsValue,
      runwareCommon.generateImagesFromExistingImageSchema
    );
    return await runwareCommon.generateImages({
      apiKey,
      ...propsValue,
    });
  },
});
