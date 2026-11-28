import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { cometApiAuth } from '../../../auth';
import { cometApiAiProps } from '../../../common/ai-props';
import { cometApiClient } from '../../../common/client';
import { cometapiKlingIdentifyFaceOutputSchema } from '../../../output-schemas';

export const klingIdentifyFaceAction = createAction({
  auth: cometApiAuth,
  name: 'cometapi_kling_identify_face',
  outputSchema: cometapiKlingIdentifyFaceOutputSchema,
  displayName: 'Kling Identify Faces',
  description:
    'Detects the faces in a video and opens a Kling lip-sync session.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Detects faces in a video and returns a lip-sync session_id plus face_data with each face_id, preview and time range; this is the required first step of Kling Create Lip Sync. Give exactly one of Video ID (a video id from a finished Kling task result) or Video URL (a hosted MP4/MOV).',
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
      path: '/kling/v1/videos/identify-face',
      body: { video_id: videoId, video_url: videoUrl },
    });
  },
});
