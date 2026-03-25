import { propsValidation } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { runwareAuth, runwareCommon } from '../common';

export const generateImagesFromText = createAction({
  auth: runwareAuth,
  name: 'generateImagesFromText',
  displayName: 'Generate Images from Text',
  description: 'Produce images from a text description.',
  props: runwareCommon.generateImagesFromTextProperties,
  async run({ auth: apiKey, propsValue }) {
    await propsValidation.validateZod(
      propsValue,
      runwareCommon.generateImagesFromTextSchema
    );
    return await runwareCommon.generateImages({
      apiKey,
      ...propsValue,
    });
  },
});
