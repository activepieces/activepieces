import { propsValidation } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { runwareAuth, runwareCommon } from '../common';

export const generateImagesFromText = createAction({
  auth: runwareAuth,
  name: 'generateImagesFromText',
  displayName: 'Generate Images from Text',
  description: 'Produce images from a text description.',
  audience: 'both',
  aiMetadata: { description: 'Generates one or more brand-new images from a text prompt using Runware (text-to-image). Choose this for pure text-to-image generation when no source image is supplied; requires a positive prompt, a model AIR identifier, and width/height. Not idempotent: each call runs a fresh generation, and unless a fixed seed is provided the output varies between runs.', idempotent: false },
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
