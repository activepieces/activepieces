import { propsValidation } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { runwareAuth, runwareCommon } from '../common';

export const imageBackgroundRemoval = createAction({
  auth: runwareAuth,
  name: 'imageBackgroundRemoval',
  displayName: 'Image Background Removal',
  description: 'Request image background removal.',
  audience: 'both',
  aiMetadata: { description: 'Removes the background from an input image using Runware, returning a newly generated image (optionally PNG, JPG, or WEBP). Choose this to isolate a subject or produce a transparent cutout; requires the input image as a URL and a model AIR identifier. Not idempotent: each call submits a fresh generation request rather than returning a stored result.', idempotent: false },
  props: runwareCommon.imageBackgroundRemovalProperties,
  async run({ auth: apiKey, propsValue }) {
    await propsValidation.validateZod(
      propsValue,
      runwareCommon.imageBackgroundRemovalSchema
    );
    const { outputFormat, ...restProps } = propsValue;
    return await runwareCommon.imageBackgroundRemoval({
      apiKey,
      ...restProps,
      ...(outputFormat
        ? { outputFormat: outputFormat as 'PNG' | 'JPG' | 'WEBP' }
        : {}),
    });
  },
});
