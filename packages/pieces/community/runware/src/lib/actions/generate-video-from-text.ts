import { propsValidation } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { runwareAuth, runwareCommon } from '../common';

export const generateVideoFromText = createAction({
  auth: runwareAuth,
  name: 'generateVideoFromText',
  displayName: 'Generate Video from Text',
  description: 'Generate video from text prompt.',
  audience: 'both',
  aiMetadata: { description: 'Generates one or more videos from a text prompt using Runware (text-to-video). Choose this for producing video clips rather than still images; requires a positive prompt and a model AIR identifier, with optional duration, fps, and output format (MP4, WEBM, or MOV). Not idempotent: each call runs a fresh generation and output varies between runs.', idempotent: false },
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
