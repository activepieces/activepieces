import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { cometApiAuth } from '../../../auth';
import { cometApiAiProps } from '../../../common/ai-props';
import { cometApiClient } from '../../../common/client';
import { cometApiUtils } from '../../../common/utils';
import { cometapiKlingImageToVideoOutputSchema } from '../../../output-schemas';

const MODELS = [
  'kling-v1',
  'kling-v1-5',
  'kling-v1-6',
  'kling-v2-master',
  'kling-v2-1',
  'kling-v2-1-master',
  'kling-v2-5-turbo',
  'kling-v2-6',
  'kling-v3',
];

export const klingImageToVideoAction = createAction({
  auth: cometApiAuth,
  name: 'cometapi_kling_image_to_video',
  outputSchema: cometapiKlingImageToVideoOutputSchema,
  displayName: 'Kling Image to Video',
  description:
    'Starts a Kling video generation that animates one source image.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Starts a billed Kling image-to-video task on the legacy /kling/v1 route from one image (optionally a tail frame) and returns its task_id and status; poll it with Kling Get Task using kind videos/image2video. Pick Kling Multi-Image to Video for 2-4 reference images, or Kling Route Image to Video for the kling-2.5-turbo to kling-4.0 model routes.',
    idempotent: false,
  },
  props: {
    image: Property.ShortText({
      displayName: 'Image',
      description:
        'Source image as a public URL or base64 string. Tiny thumbnails are rejected.',
      required: true,
    }),
    prompt: Property.LongText({
      displayName: 'Prompt',
      description: 'The motion to create. Up to 500 characters.',
      required: false,
    }),
    negativePrompt: cometApiAiProps.klingNegativePrompt({ required: false }),
    imageTail: Property.ShortText({
      displayName: 'Tail Image',
      description: 'Last-frame image as a public URL or base64 string.',
      required: false,
    }),
    modelName: Property.StaticDropdown({
      displayName: 'Model',
      description: 'Kling video model. Defaults to kling-v1.',
      required: false,
      options: { options: cometApiUtils.toOptions({ values: MODELS }) },
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
        'Any other request body fields as a JSON object, e.g. static_mask or dynamic_masks. Dedicated inputs above take precedence over the same key here.',
    }),
  },
  async run({ auth, propsValue }) {
    return await cometApiClient.request({
      auth,
      method: HttpMethod.POST,
      host: 'root',
      path: '/kling/v1/videos/image2video',
      body: cometApiUtils.withAdditionalFields({
        additionalFields: propsValue.additionalFields,
        fields: {
          image: propsValue.image,
          prompt: propsValue.prompt,
          negative_prompt: propsValue.negativePrompt,
          image_tail: propsValue.imageTail,
          model_name: propsValue.modelName,
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
