import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { cometApiAuth } from '../../../auth';
import { cometApiAiProps } from '../../../common/ai-props';
import { cometApiClient } from '../../../common/client';
import { cometApiUtils } from '../../../common/utils';
import { cometapiKlingExpandImageOutputSchema } from '../../../output-schemas';

export const klingMultiImageToImageAction = createAction({
  auth: cometApiAuth,
  name: 'cometapi_kling_multi_image_to_image',
  outputSchema: cometapiKlingExpandImageOutputSchema,
  displayName: 'Kling Multi-Image to Image',
  description:
    'Starts a Kling task that composes one image from subject, scene and style references.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Starts an async Kling task that combines one to four subject images with optional scene and style images into a new image, and returns data.task_id and data.task_status. Read the result with Kling Get Task (Task Kind images/multi-image2image). Use Kling Create Omni Image to cite references by index in the prompt. Each call is a billed generation.',
    idempotent: false,
  },
  props: {
    modelName: Property.StaticDropdown({
      displayName: 'Model',
      description:
        'Use kling-v2-1 for new requests; omitting it uses the legacy kling-v2 default.',
      required: false,
      options: {
        options: [
          { label: 'kling-v2-1', value: 'kling-v2-1' },
          { label: 'kling-v2', value: 'kling-v2' },
        ],
      },
    }),
    subjectImageList: Property.Array({
      displayName: 'Subject Images',
      description: 'One to four subject reference images.',
      required: true,
      properties: {
        subject_image: cometApiAiProps.klingImage({
          required: true,
          displayName: 'Subject Image',
        }),
      },
    }),
    prompt: Property.LongText({
      displayName: 'Prompt',
      description: 'Text describing the desired output, up to 2500 characters.',
      required: false,
    }),
    negativePrompt: cometApiAiProps.klingNegativePrompt({
      required: false,
      description: 'What to exclude, up to 2500 characters.',
    }),
    sceneImage: cometApiAiProps.klingImage({
      required: false,
      displayName: 'Scene Image',
    }),
    styleImage: cometApiAiProps.klingImage({
      required: false,
      displayName: 'Style Image',
    }),
    n: cometApiAiProps.numberOfImages({ required: false }),
    aspectRatio: cometApiAiProps.klingImageAspectRatio({ required: false }),
    watermark: cometApiAiProps.watermark({
      required: false,
      description: 'Whether to add the official Kling watermark.',
    }),
    additionalFields: cometApiAiProps.additionalFields({ required: false }),
  },
  async run({ auth, propsValue }) {
    const { watermark } = propsValue;
    return await cometApiClient.request({
      auth,
      method: HttpMethod.POST,
      host: 'root',
      path: '/kling/v1/images/multi-image2image',
      body: cometApiUtils.withAdditionalFields({
        additionalFields: propsValue.additionalFields,
        fields: {
          model_name: propsValue.modelName,
          subject_image_list: propsValue.subjectImageList,
          prompt: propsValue.prompt,
          negative_prompt: propsValue.negativePrompt,
          scene_image: propsValue.sceneImage,
          style_image: propsValue.styleImage,
          n: propsValue.n,
          aspect_ratio: propsValue.aspectRatio,
          watermark_info:
            watermark === undefined
              ? undefined
              : { enabled: cometApiUtils.toBoolean({ value: watermark }) },
        },
      }),
    });
  },
});
