import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { cometApiAuth } from '../../../auth';
import { cometApiAiProps } from '../../../common/ai-props';
import { cometApiClient } from '../../../common/client';
import { cometApiUtils } from '../../../common/utils';
import { cometapiKlingTextToVideoOutputSchema } from '../../../output-schemas';

const MODELS = [
  'kling-v1',
  'kling-v1-6',
  'kling-v2-master',
  'kling-v2-1-master',
  'kling-v2-5-turbo',
  'kling-v2-6',
  'kling-v3',
];

export const klingTextToVideoAction = createAction({
  auth: cometApiAuth,
  name: 'cometapi_kling_text_to_video',
  outputSchema: cometapiKlingTextToVideoOutputSchema,
  displayName: 'Kling Text to Video',
  description: 'Starts a Kling video generation from a text prompt.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Starts a billed Kling text-to-video task on the legacy /kling/v1 route and returns its task_id and status; poll it with Kling Get Task using kind videos/text2video. Pick Kling Route Text to Video for the newer kling-2.5-turbo to kling-4.0 model routes. Duration is 5 or 10 seconds.',
    idempotent: false,
  },
  props: {
    prompt: Property.LongText({
      displayName: 'Prompt',
      description: 'What the video shows. Up to 500 characters.',
      required: true,
    }),
    negativePrompt: cometApiAiProps.klingNegativePrompt({ required: false }),
    modelName: Property.StaticDropdown({
      displayName: 'Model',
      description: 'Kling video model. Defaults to kling-v1.',
      required: false,
      options: { options: cometApiUtils.toOptions({ values: MODELS }) },
    }),
    aspectRatio: cometApiAiProps.klingVideoAspectRatio({
      required: false,
      description: 'Defaults to 16:9.',
    }),
    duration: cometApiAiProps.klingDuration({
      required: false,
      description: 'Defaults to 5.',
    }),
    mode: cometApiAiProps.klingMode({
      required: false,
      description:
        'std is faster, pro is higher quality and costs more. Defaults to std.',
    }),
    sound: cometApiAiProps.klingSound({ required: false }),
    cfgScale: cometApiAiProps.klingCfgScale({ required: false }),
    callbackUrl: cometApiAiProps.klingCallbackUrl({ required: false }),
    externalTaskId: cometApiAiProps.klingExternalTaskId({ required: false }),
    additionalFields: cometApiAiProps.additionalFields({
      required: false,
      description:
        'Any other request body fields as a JSON object, e.g. camera_control. Dedicated inputs above take precedence over the same key here.',
    }),
  },
  async run({ auth, propsValue }) {
    return await cometApiClient.request({
      auth,
      method: HttpMethod.POST,
      host: 'root',
      path: '/kling/v1/videos/text2video',
      body: cometApiUtils.withAdditionalFields({
        additionalFields: propsValue.additionalFields,
        fields: {
          prompt: propsValue.prompt,
          negative_prompt: propsValue.negativePrompt,
          model_name: propsValue.modelName,
          aspect_ratio: propsValue.aspectRatio,
          duration: propsValue.duration,
          mode: propsValue.mode,
          sound: propsValue.sound,
          cfg_scale: propsValue.cfgScale,
          callback_url: propsValue.callbackUrl,
          external_task_id: propsValue.externalTaskId,
        },
      }),
    });
  },
});
