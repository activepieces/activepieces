import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { cometApiAuth } from '../../../auth';
import { cometApiAiProps } from '../../../common/ai-props';
import { cometApiClient } from '../../../common/client';
import { cometApiUtils } from '../../../common/utils';
import { cometapiKlingExpandImageOutputSchema } from '../../../output-schemas';

const MODELS = ['kling-v3', 'kling-v2-1', 'kling-v2', 'kling-v1-5', 'kling-v1'];
export const klingGenerateImageAction = createAction({
  auth: cometApiAuth,
  name: 'cometapi_kling_generate_image',
  outputSchema: cometapiKlingExpandImageOutputSchema,
  displayName: 'Kling Generate Image',
  description:
    'Starts a Kling image generation task from a prompt and an optional reference image.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Starts an async Kling image task from a prompt, optionally guided by one reference image, and returns data.task_id and data.task_status. Read the result with Kling Get Task (Task Kind images/generations). Use Kling Create Omni Image for several cited references, Kling Multi-Image to Image for subject/scene/style references. Each call is a billed generation.',
    idempotent: false,
  },
  props: {
    modelName: Property.StaticDropdown({
      displayName: 'Model',
      description:
        'Use kling-v3 for new requests; omitting it uses the legacy kling-v1 default.',
      required: false,
      options: {
        options: cometApiUtils.toOptions({ values: MODELS }),
      },
    }),
    prompt: Property.LongText({
      displayName: 'Prompt',
      description: 'Text describing the image, up to 2500 characters.',
      required: true,
    }),
    negativePrompt: cometApiAiProps.klingNegativePrompt({
      required: false,
      description:
        'What to exclude. Not supported together with Reference Image.',
    }),
    image: cometApiAiProps.klingImage({
      required: false,
      displayName: 'Reference Image',
    }),
    imageReference: Property.StaticDropdown({
      displayName: 'Image Reference Mode',
      description: 'Legacy models with Reference Image: subject or face.',
      required: false,
      options: {
        options: [
          { label: 'subject', value: 'subject' },
          { label: 'face', value: 'face' },
        ],
      },
    }),
    imageFidelity: Property.Number({
      displayName: 'Image Fidelity',
      description:
        'How closely the output follows the reference image, 0 to 1.',
      required: false,
    }),
    resolution: Property.StaticDropdown({
      displayName: 'Resolution',
      description: 'Defaults to 1k.',
      required: false,
      options: {
        options: [
          { label: '1k', value: '1k' },
          { label: '2k', value: '2k' },
        ],
      },
    }),
    n: cometApiAiProps.numberOfImages({ required: false }),
    aspectRatio: cometApiAiProps.klingImageAspectRatio({ required: false }),
    watermark: cometApiAiProps.watermark({
      required: false,
      description: 'Whether to add the official Kling watermark.',
    }),
    additionalFields: cometApiAiProps.additionalFields({
      required: false,
      description:
        'Other body fields as a JSON object, e.g. human_fidelity, element_list or external_task_id. Dedicated inputs above take precedence over the same key here.',
    }),
  },
  async run({ auth, propsValue }) {
    const { watermark } = propsValue;
    return await cometApiClient.request({
      auth,
      method: HttpMethod.POST,
      host: 'root',
      path: '/kling/v1/images/generations',
      body: cometApiUtils.withAdditionalFields({
        additionalFields: propsValue.additionalFields,
        fields: {
          model_name: propsValue.modelName,
          prompt: propsValue.prompt,
          negative_prompt: propsValue.negativePrompt,
          image: propsValue.image,
          image_reference: propsValue.imageReference,
          image_fidelity: propsValue.imageFidelity,
          resolution: propsValue.resolution,
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
