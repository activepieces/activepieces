import { propsValidation } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { runwareAuth, runwareCommon } from '../common';

export const generateImagesFromExistingImage = createAction({
  auth: runwareAuth,
  name: 'generateImagesFromExistingImage',
  displayName: 'Generate Images from Existing Image',
  description: 'Generate new images based on a provided image (image-to-image).',
  audience: 'both',
  aiMetadata: { description: 'Generates new images conditioned on a source seed image plus a text prompt using Runware (image-to-image). Choose this over text-to-image when transforming or restyling an existing picture; requires the seed image as a URL, a model AIR identifier, a positive prompt, and width/height, with an optional strength controlling how far the result departs from the source. Not idempotent: each call runs a fresh generation that varies unless a fixed seed is set.', idempotent: false },
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
