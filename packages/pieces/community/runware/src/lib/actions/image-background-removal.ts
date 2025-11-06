import { propsValidation } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { runwareAuth, runwareCommon } from '../common';

export const imageBackgroundRemoval = createAction({
  auth: runwareAuth,
  name: 'imageBackgroundRemoval',
  displayName: 'Image Background Removal',
  description: 'Request image background removal.',
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
