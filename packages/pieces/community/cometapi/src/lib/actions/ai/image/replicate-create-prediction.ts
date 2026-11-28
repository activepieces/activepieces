import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { cometApiAuth } from '../../../auth';
import { cometApiAiProps } from '../../../common/ai-props';
import { cometApiClient } from '../../../common/client';
import { cometApiUtils } from '../../../common/utils';
import { cometapiReplicateCreatePredictionOutputSchema } from '../../../output-schemas';

export const replicateCreatePredictionAction = createAction({
  auth: cometApiAuth,
  name: 'cometapi_replicate_create_prediction',
  outputSchema: cometapiReplicateCreatePredictionOutputSchema,
  displayName: 'Replicate Create Prediction',
  description:
    'Starts a Replicate-format image prediction, e.g. with FLUX Schnell or FLUX Kontext.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Starts a Replicate-format prediction for a model such as black-forest-labs/flux-schnell or black-forest-labs/flux-kontext-pro and returns its id, status and any output URLs so far. Read the finished output with Replicate Get Prediction using that id. Each call is a billed generation.',
    idempotent: false,
  },
  props: {
    model: cometApiAiProps.model({
      required: true,
      description:
        'Replicate model ID as owner/name, e.g. "black-forest-labs/flux-schnell".',
    }),
    prompt: Property.LongText({
      displayName: 'Prompt',
      required: true,
    }),
    aspectRatio: Property.ShortText({
      displayName: 'Aspect Ratio',
      description: 'e.g. "1:1", "16:9", "9:16", "3:2" or "2:3".',
      required: false,
    }),
    outputFormat: Property.StaticDropdown({
      displayName: 'Output Format',
      required: false,
      options: {
        options: [
          { label: 'webp', value: 'webp' },
          { label: 'png', value: 'png' },
          { label: 'jpg', value: 'jpg' },
          { label: 'jpeg', value: 'jpeg' },
        ],
      },
    }),
    outputQuality: Property.Number({
      displayName: 'Output Quality',
      description: 'Compression quality from 1 to 100.',
      required: false,
    }),
    inputImage: Property.ShortText({
      displayName: 'Input Image URL',
      description:
        'Reference image URL for edit models such as flux-kontext-pro.',
      required: false,
    }),
    inputImages: Property.Array({
      displayName: 'Input Image URLs',
      description: 'Several reference image URLs, for models that accept them.',
      required: false,
    }),
    additionalInput: cometApiAiProps.additionalFields({
      required: false,
      displayName: 'Additional Input',
      description:
        'Other model-specific fields for the input object, as JSON. Dedicated inputs above take precedence over the same key here.',
    }),
  },
  async run({ auth, propsValue }) {
    const { inputImages } = propsValue;
    return await cometApiClient.request({
      auth,
      method: HttpMethod.POST,
      host: 'root',
      path: `/replicate/v1/models/${propsValue.model
        .split('/')
        .map(encodeURIComponent)
        .join('/')}/predictions`,
      body: {
        input: cometApiUtils.withAdditionalFields({
          additionalFields: propsValue.additionalInput,
          fields: {
            prompt: propsValue.prompt,
            aspect_ratio: propsValue.aspectRatio,
            output_format: propsValue.outputFormat,
            output_quality: propsValue.outputQuality,
            input_image: propsValue.inputImage,
            input_images:
              inputImages && inputImages.length > 0 ? inputImages : undefined,
          },
        }),
      },
    });
  },
});
