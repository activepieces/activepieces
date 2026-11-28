import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { cometApiAuth } from '../../../auth';
import { cometApiAiProps } from '../../../common/ai-props';
import { cometApiClient } from '../../../common/client';
import { cometApiUtils } from '../../../common/utils';
import { cometapiKlingImageToVideoOutputSchema } from '../../../output-schemas';

export const klingMultiImageToVideoAction = createAction({
  auth: cometApiAuth,
  name: 'cometapi_kling_multi_image_to_video',
  outputSchema: cometapiKlingImageToVideoOutputSchema,
  displayName: 'Kling Multi-Image to Video',
  description:
    'Starts a Kling video generation from up to four reference images.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Starts a billed Kling multi-image-to-video task (kling-v1-6) from 1 to 4 reference images and returns its task_id and status; poll it with Kling Get Task using kind videos/multi-image2video. Pick Kling Image to Video for one image with a tail frame or masks.',
    idempotent: false,
  },
  props: {
    imageList: Property.Array({
      displayName: 'Images',
      description: '1 to 4 reference images.',
      required: true,
      properties: {
        image: Property.ShortText({
          displayName: 'Image',
          description: 'Public image URL or base64 string.',
          required: true,
        }),
      },
    }),
    prompt: Property.LongText({
      displayName: 'Prompt',
      description: 'The motion and scene to create.',
      required: false,
    }),
    negativePrompt: cometApiAiProps.klingNegativePrompt({
      required: false,
      description: 'What to keep out of the video.',
    }),
    aspectRatio: cometApiAiProps.klingVideoAspectRatio({ required: false }),
    duration: cometApiAiProps.klingDuration({
      required: false,
      description: 'Defaults to 5.',
    }),
    mode: cometApiAiProps.klingMode({
      required: false,
      description:
        'std is faster, pro is higher quality and costs more. Defaults to std.',
    }),
    callbackUrl: cometApiAiProps.klingCallbackUrl({ required: false }),
    externalTaskId: cometApiAiProps.klingExternalTaskId({ required: false }),
    additionalFields: cometApiAiProps.additionalFields({ required: false }),
  },
  async run({ auth, propsValue }) {
    return await cometApiClient.request({
      auth,
      method: HttpMethod.POST,
      host: 'root',
      path: '/kling/v1/videos/multi-image2video',
      body: cometApiUtils.withAdditionalFields({
        additionalFields: propsValue.additionalFields,
        fields: {
          image_list: propsValue.imageList,
          prompt: propsValue.prompt,
          negative_prompt: propsValue.negativePrompt,
          aspect_ratio: propsValue.aspectRatio,
          duration: propsValue.duration,
          mode: propsValue.mode,
          callback_url: propsValue.callbackUrl,
          external_task_id: propsValue.externalTaskId,
        },
      }),
    });
  },
});
