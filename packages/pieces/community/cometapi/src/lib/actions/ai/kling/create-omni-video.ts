import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { cometApiAuth } from '../../../auth';
import { cometApiAiProps } from '../../../common/ai-props';
import { cometApiClient } from '../../../common/client';
import { cometApiUtils } from '../../../common/utils';
import { cometapiKlingCreateOmniVideoOutputSchema } from '../../../output-schemas';

export const klingCreateOmniVideoAction = createAction({
  auth: cometApiAuth,
  name: 'cometapi_kling_create_omni_video',
  outputSchema: cometapiKlingCreateOmniVideoOutputSchema,
  displayName: 'Kling Create Omni Video',
  description:
    'Starts a Kling Omni video generation from text and an optional first-frame image.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Starts a billed Kling Omni (O1-compatible, legacy /kling/v1 route) video task from a prompt and an optional first-frame image and returns its task_id and status; poll it with Kling Get Omni Video, not Kling Get Task. Pick Kling Route Omni Video for kling-4.0, kling-3.0-omni or reference/base videos. Reference the first frame in the prompt as <<<image_1>>>.',
    idempotent: false,
  },
  props: {
    prompt: Property.LongText({
      displayName: 'Prompt',
      description:
        'What the video shows. Up to 2,500 characters. Reference the first frame as <<<image_1>>>.',
      required: true,
    }),
    modelName: Property.ShortText({
      displayName: 'Model',
      description:
        'Omni model ID, e.g. "kling-video-o1" or "kling-v3-omni". Leave empty for the route default.',
      required: false,
    }),
    firstFrame: Property.ShortText({
      displayName: 'First Frame Image',
      description:
        'Public image URL or base64 string used as the first video frame.',
      required: false,
    }),
    aspectRatio: cometApiAiProps.klingVideoAspectRatio({
      required: false,
      description: 'Required when no first frame is given. Defaults to 16:9.',
    }),
    duration: cometApiAiProps.klingDuration({
      required: false,
      description: 'Defaults to 5.',
    }),
    mode: cometApiAiProps.klingMode({
      required: false,
      description: 'std, or pro where the model supports it.',
    }),
    sound: cometApiAiProps.klingSound({
      required: false,
      description: 'Generate audio with the video. Defaults to off.',
    }),
    watermark: cometApiAiProps.watermark({
      required: false,
      description: 'true also returns watermarked result URLs.',
    }),
    callbackUrl: cometApiAiProps.klingCallbackUrl({ required: false }),
    externalTaskId: cometApiAiProps.klingExternalTaskId({ required: false }),
    additionalFields: cometApiAiProps.additionalFields({ required: false }),
  },
  async run({ auth, propsValue }) {
    const { firstFrame, watermark } = propsValue;
    return await cometApiClient.request({
      auth,
      method: HttpMethod.POST,
      host: 'root',
      path: '/kling/v1/videos/omni-video',
      body: cometApiUtils.withAdditionalFields({
        additionalFields: propsValue.additionalFields,
        fields: {
          prompt: propsValue.prompt,
          model_name: propsValue.modelName,
          image_list: firstFrame
            ? [{ image_url: firstFrame, type: 'first_frame' }]
            : undefined,
          aspect_ratio: propsValue.aspectRatio,
          duration: propsValue.duration,
          mode: propsValue.mode,
          sound: propsValue.sound,
          watermark_info: watermark
            ? { enabled: cometApiUtils.toBoolean({ value: watermark }) }
            : undefined,
          callback_url: propsValue.callbackUrl,
          external_task_id: propsValue.externalTaskId,
        },
      }),
    });
  },
});
