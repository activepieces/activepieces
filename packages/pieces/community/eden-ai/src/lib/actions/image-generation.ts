import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { edenApiCall } from '../common/client';
import { edenAuth } from '../common/auth';

export const imageGenerationAction = createAction({
  name: 'edenai-image-generation',
  auth: edenAuth,
  displayName: 'Image Generation',
  description: 'Generate images from text prompts using various AI image generation providers via Eden AI.',
  props: {
    text: Property.LongText({
      displayName: 'Text Prompt',
      description: 'The text prompt to generate an image from.',
      required: true,
    }),
    providers: Property.Array({
      displayName: 'Providers',
      description: 'One or more providers (e.g., ["openai", "stabilityai"]) or providers with model (e.g., ["openai/dall-e-3"])',
      required: true,
    }),
    resolution: Property.ShortText({
      displayName: 'Resolution',
      description: 'Image resolution (e.g., "1024x1024", "512x512").',
      required: false,
    }),
    num_images: Property.Number({
      displayName: 'Number of Images',
      description: 'Number of images to generate (default: 1).',
      required: false,
    }),
    fallback_providers: Property.Array({
      displayName: 'Fallback Providers',
      description: 'Optional list of up to 5 fallback providers, used if the primary one fails.',
      required: false,
    }),
    response_as_dict: Property.Checkbox({
      displayName: 'Response as Dictionary',
      description: 'If enabled, groups responses under provider keys. If disabled, returns a list of results.',
      defaultValue: true,
      required: false,
    }),
    attributes_as_list: Property.Checkbox({
      displayName: 'Attributes as List',
      description: 'If enabled, returns each attribute as a list instead of list of objects.',
      defaultValue: false,
      required: false,
    }),
    show_original_response: Property.Checkbox({
      displayName: 'Show Original Response',
      description: 'Whether to include the original response from the provider.',
      defaultValue: false,
      required: false,
    }),
  },
  async run(context) {
    const response = await edenApiCall<any>({
      method: HttpMethod.POST,
      auth: { apiKey: context.auth },
      resourceUri: '/image/generation',
      body: {
        text: context.propsValue.text,
        providers: context.propsValue.providers,
        resolution: context.propsValue.resolution,
        num_images: context.propsValue.num_images,
        fallback_providers: context.propsValue.fallback_providers,
        response_as_dict: context.propsValue.response_as_dict,
        attributes_as_list: context.propsValue.attributes_as_list,
        show_original_response: context.propsValue.show_original_response,
      },
    });

    return response;
  },
});
