import { propsValidation } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { vlmRunAuth, vlmRunCommon } from '../common';
import { analyzeVideoProperties } from '../common/properties';
import { analyzeVideoSchema } from '../common/schemas';

export const analyzeVideo = createAction({
  auth: vlmRunAuth,
  name: 'analyzeVideo',
  displayName: 'Analyze Video',
  description:
    'Analyze a video file or URL, e.g. extract frames, detect content, etc.',
  audience: 'both',
  aiMetadata: { description: 'Analyze a video with VLM Run; uploads the file then runs a prediction in a chosen domain that switches the task between full transcription, various summaries (transcription, product-demo, conferencing, podcast, or general), and dashcam analytics. Choose this for transcription or content understanding of video. The domain input is required and determines the analysis performed; each call launches a new prediction job and polls until complete, so it is not idempotent.', idempotent: false },
  props: analyzeVideoProperties,
  async run({ auth: apiKey, propsValue }) {
    await propsValidation.validateZod(propsValue, analyzeVideoSchema);

    const { video, domain } = propsValue;

    const uploadResponse = await vlmRunCommon.uploadFile({
      apiKey:apiKey.secret_text,
      file: video,
    });

    const response = await vlmRunCommon.analyzeVideo({
      apiKey:apiKey.secret_text,
      file_id: uploadResponse.id,
      domain,
    });

    return await vlmRunCommon.getresponse(apiKey.secret_text, response.id, response.status);
  },
});
