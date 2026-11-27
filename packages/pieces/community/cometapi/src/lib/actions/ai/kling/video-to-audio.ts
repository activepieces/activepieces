import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { cometApiAuth } from '../../../auth';
import { cometApiAiProps } from '../../../common/ai-props';
import { cometApiClient } from '../../../common/client';
import { cometApiUtils } from '../../../common/utils';
import { cometapiKlingCreateLipSyncOutputSchema } from '../../../output-schemas';

export const klingVideoToAudioAction = createAction({
  auth: cometApiAuth,
  name: 'cometapi_kling_video_to_audio',
  outputSchema: cometapiKlingCreateLipSyncOutputSchema,
  displayName: 'Kling Video to Audio',
  description: 'Starts a Kling task that generates audio for a video.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Starts a billed Kling video-to-audio task that generates a soundtrack for a 3-20 s video and returns its task_id and status; poll it with Kling Get Task using kind audio/video-to-audio. Give exactly one of Video ID (from a Kling task result, created within the last 30 days) or Video URL (a hosted MP4/MOV up to 100 MB).',
    idempotent: false,
  },
  props: {
    videoId: cometApiAiProps.klingVideoId({ required: false }),
    videoUrl: cometApiAiProps.klingVideoUrl({
      required: false,
      description:
        'Public MP4 or MOV URL, 720p or 1080p, 3-20 seconds. Use this or Video ID.',
    }),
    callbackUrl: cometApiAiProps.klingCallbackUrl({ required: false }),
    externalTaskId: cometApiAiProps.klingExternalTaskId({ required: false }),
    additionalFields: cometApiAiProps.additionalFields({ required: false }),
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
      path: '/kling/v1/audio/video-to-audio',
      body: cometApiUtils.withAdditionalFields({
        additionalFields: propsValue.additionalFields,
        fields: {
          video_id: videoId,
          video_url: videoUrl,
          callback_url: propsValue.callbackUrl,
          external_task_id: propsValue.externalTaskId,
        },
      }),
    });
  },
});
