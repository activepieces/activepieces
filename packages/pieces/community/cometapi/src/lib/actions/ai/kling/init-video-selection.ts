import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { cometApiAuth } from '../../../auth';
import { cometApiAiProps } from '../../../common/ai-props';
import { cometApiClient } from '../../../common/client';
import { cometapiKlingInitVideoSelectionOutputSchema } from '../../../output-schemas';

export const klingInitVideoSelectionAction = createAction({
  auth: cometApiAuth,
  name: 'cometapi_kling_init_video_selection',
  outputSchema: cometapiKlingInitVideoSelectionOutputSchema,
  displayName: 'Kling Init Video Selection',
  description: 'Opens a Kling multi-element editing session for a video.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Opens a Kling multi-element video-editing session and returns its session_id, the first step of a chain: Kling Add/Delete/Clear/Preview Video Selection then Kling Create Multi-Element Video all take that session_id on the same account. Give exactly one of Video ID (from a finished Kling task result) or Video URL (a hosted MP4/MOV).',
    idempotent: false,
  },
  props: {
    videoId: cometApiAiProps.klingVideoId({ required: false }),
    videoUrl: cometApiAiProps.klingVideoUrl({ required: false }),
  },
  async run({ auth, propsValue }) {
    const { videoId, videoUrl } = propsValue;
    if (Boolean(videoId) === Boolean(videoUrl)) {
      throw new Error('Provide exactly one of Video ID or Video URL.');
    }
    return await cometApiClient.request({
      auth,
      method: HttpMethod.POST,
      host: 'root',
      path: '/kling/v1/videos/multi-elements/init-selection',
      body: { video_id: videoId, video_url: videoUrl },
    });
  },
});
