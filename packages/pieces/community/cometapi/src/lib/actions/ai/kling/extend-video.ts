import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { cometApiAuth } from '../../../auth';
import { cometApiAiProps } from '../../../common/ai-props';
import { cometApiClient } from '../../../common/client';
import { cometApiUtils } from '../../../common/utils';
import { cometapiKlingExtendVideoOutputSchema } from '../../../output-schemas';

export const klingExtendVideoAction = createAction({
  auth: cometApiAuth,
  name: 'cometapi_kling_extend_video',
  outputSchema: cometapiKlingExtendVideoOutputSchema,
  displayName: 'Kling Extend Video',
  description: 'Starts a Kling task that continues an existing Kling video.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Starts a billed Kling video-extension task and returns its task_id and status; poll it with Kling Get Task using kind videos/video-extend. The parent must be a fresh, finished 5 s kling-v1 or kling-v1-6 video from Kling Text to Video or Kling Image to Video on the same account, extended promptly; other parents return HTTP 400.',
    idempotent: false,
  },
  props: {
    taskId: Property.ShortText({
      displayName: 'Parent Task ID',
      description:
        'The task_id of the parent Kling Text to Video or Kling Image to Video task.',
      required: true,
    }),
    videoId: cometApiAiProps.klingVideoId({
      required: true,
      description:
        'The video id from the parent task result (task_result.videos[].id), read with Kling Get Task.',
    }),
    prompt: Property.LongText({
      displayName: 'Prompt',
      description: 'Motion for the extended segment. Up to 500 characters.',
      required: false,
    }),
    negativePrompt: cometApiAiProps.klingNegativePrompt({
      required: false,
      description: 'What to keep out of the extension.',
    }),
    cfgScale: cometApiAiProps.klingCfgScale({ required: false }),
    callbackUrl: cometApiAiProps.klingCallbackUrl({ required: false }),
    additionalFields: cometApiAiProps.additionalFields({ required: false }),
  },
  async run({ auth, propsValue }) {
    return await cometApiClient.request({
      auth,
      method: HttpMethod.POST,
      host: 'root',
      path: '/kling/v1/videos/video-extend',
      body: cometApiUtils.withAdditionalFields({
        additionalFields: propsValue.additionalFields,
        fields: {
          task_id: propsValue.taskId,
          video_id: propsValue.videoId,
          prompt: propsValue.prompt,
          negative_prompt: propsValue.negativePrompt,
          cfg_scale: propsValue.cfgScale,
          callback_url: propsValue.callbackUrl,
        },
      }),
    });
  },
});
