import { propsValidation } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { runwareAuth, runwareCommon } from '../common';

export const generateVideoFromText = createAction({
  auth: runwareAuth,
  name: 'generateVideoFromText',
  displayName: 'Generate Video from Text',
  description: 'Generate video from text prompt.',
  props: runwareCommon.generateVideoFromTextProperties,
  async run({ auth: apiKey, propsValue }) {
    await propsValidation.validateZod(
      propsValue,
      runwareCommon.generateVideoFromTextSchema
    );
    const { outputFormat, ...restProps } = propsValue;
    return await runwareCommon.generateVideoFromText({
      apiKey,
      ...restProps,
      ...(outputFormat
        ? { outputFormat: outputFormat as 'MP4' | 'WEBM' | 'MOV' }
        : {}),
    });
  },
});
