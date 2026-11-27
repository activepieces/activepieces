import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { cometApiAuth } from '../../../auth';
import { cometApiAiProps } from '../../../common/ai-props';
import { cometApiClient } from '../../../common/client';
import { cometApiUtils } from '../../../common/utils';
import { cometapiGenerateImageOutputSchema } from '../../../output-schemas';

export const generateImageAction = createAction({
  auth: cometApiAuth,
  name: 'cometapi_generate_image',
  outputSchema: cometapiGenerateImageOutputSchema,
  displayName: 'Generate Image',
  description:
    'Creates images from a text prompt with an OpenAI-compatible image model (GPT Image, Grok, Seedream and others).',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Generates images from a prompt on the OpenAI-compatible route shared by GPT Image, Grok Imagine, Seedream and Qwen-Image models; the images are under result (GPT image models return base64 in result.data[].b64_json, others may return result.data[].url). Set Async to true (gpt-image-2 and Seedream models) to get task.data.task_id back instead and read it with Get Image Task. Use Edit Image to change an existing image. Each call is a billed generation.',
    idempotent: false,
  },
  props: {
    model: cometApiAiProps.model({
      required: true,
      description:
        'Image model ID, e.g. "gpt-image-2", "grok-imagine-image-2.0" or "doubao-seedream-5-0-260128". Use List Models with feature text-to-image.',
    }),
    prompt: Property.LongText({
      displayName: 'Prompt',
      description: 'Text description of the image to generate.',
      required: true,
    }),
    n: cometApiAiProps.numberOfImages({
      required: false,
      description: 'How many images to generate. Defaults to 1.',
    }),
    size: Property.ShortText({
      displayName: 'Size',
      description:
        'Output size supported by the model, e.g. "1024x1024" for GPT Image or "2K" for Seedream.',
      required: false,
    }),
    quality: Property.ShortText({
      displayName: 'Quality',
      description:
        'GPT Image: low, medium, high or auto (xhigh and max on gpt-image-2.5 models). Grok Image 2.0: low or medium.',
      required: false,
    }),
    aspectRatio: Property.ShortText({
      displayName: 'Aspect Ratio',
      description: 'Grok models only, e.g. "16:9", "1:1" or "auto".',
      required: false,
    }),
    resolution: Property.StaticDropdown({
      displayName: 'Resolution',
      description: 'Grok models only. Defaults to 1k.',
      required: false,
      options: {
        options: [
          { label: '1k', value: '1k' },
          { label: '2k', value: '2k' },
        ],
      },
    }),
    background: Property.StaticDropdown({
      displayName: 'Background',
      description:
        'GPT Image models. transparent needs a gpt-image-2.5 model and Output Format png or webp.',
      required: false,
      options: {
        options: [
          { label: 'auto', value: 'auto' },
          { label: 'opaque', value: 'opaque' },
          { label: 'transparent', value: 'transparent' },
        ],
      },
    }),
    outputFormat: Property.StaticDropdown({
      displayName: 'Output Format',
      description: 'GPT Image models: encoded type of the b64_json image.',
      required: false,
      options: {
        options: [
          { label: 'png', value: 'png' },
          { label: 'jpeg', value: 'jpeg' },
          { label: 'webp', value: 'webp' },
        ],
      },
    }),
    responseFormat: Property.StaticDropdown({
      displayName: 'Response Format',
      description:
        'url or b64_json, for models that support it (DALL-E, Grok, Seedream). GPT Image models always return b64_json.',
      required: false,
      options: {
        options: [
          { label: 'url', value: 'url' },
          { label: 'b64_json', value: 'b64_json' },
        ],
      },
    }),
    watermark: cometApiAiProps.watermark({
      required: false,
      description: 'Seedream models: whether to add a visible watermark.',
    }),
    async: cometApiAiProps.booleanChoice({
      required: false,
      displayName: 'Async',
      description:
        'true returns a task ID to read with Get Image Task instead of the images. Documented for gpt-image-2 and Seedream models.',
    }),
    additionalFields: cometApiAiProps.additionalFields({ required: false }),
  },
  async run({ auth, propsValue }) {
    const { watermark, async } = propsValue;
    const response = await cometApiClient.request({
      auth,
      method: HttpMethod.POST,
      path: '/images/generations',
      body: cometApiUtils.withAdditionalFields({
        additionalFields: propsValue.additionalFields,
        fields: {
          model: propsValue.model,
          prompt: propsValue.prompt,
          n: propsValue.n,
          size: propsValue.size,
          quality: propsValue.quality,
          aspect_ratio: propsValue.aspectRatio,
          resolution: propsValue.resolution,
          background: propsValue.background,
          output_format: propsValue.outputFormat,
          response_format: propsValue.responseFormat,
          watermark: cometApiUtils.toBoolean({ value: watermark }),
          async: cometApiUtils.toBoolean({ value: async }),
        },
      }),
    });
    return cometApiUtils.toBoolean({ value: async })
      ? { task: response }
      : { result: response };
  },
});
