import { straicoAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';

import { baseUrlv0 } from '../common/common';

export const imageGeneration = createAction({
  auth: straicoAuth,
  name: 'image_generation',
  displayName: 'Image Generation',
  description: 'Enables users to generate high-quality images based on textual descriptions.',
  props: {
    variations: Property.StaticDropdown({
      displayName: 'Number of Images',
      required: true,
      description:
        'Number of images to generate.',
      defaultValue: 1,
      options: {
        disabled: false,
        options: [
          { value: 1, label: '1' },
          { value: 2, label: '2' },
          { value: 3, label: '3' },
          { value: 4, label: '4' },
        ],
      },
    }),
    model: Property.StaticDropdown({
      displayName: 'Model',
      required: true,
      description: 'Select the image generation model.',
      defaultValue: 'openai/dall-e-3',
      options: {
        disabled: false,
        options: [
          { value: 'openai/dall-e-3', label: 'openai/dall-e-3' },
          { value: 'flux/1.1', label: 'flux/1.1' },
          { value: 'ideogram/V_2A', label: 'ideogram/V_2A' },
          { value: 'ideogram/V_2A_TURBO', label: 'ideogram/V_2A_TURBO' },
          { value: 'ideogram/V_2', label: 'ideogram/V_2' },
          { value: 'ideogram/V_2_TURBO', label: 'ideogram/V_2_TURBO' },
          { value: 'ideogram/V_1', label: 'ideogram/V_1' },
          { value: 'ideogram/V_1_TURBO', label: 'ideogram/V_1_TURBO' }
        ],
      },
    }),
    size: Property.StaticDropdown({
      displayName: 'Image Dimensions',
      required: true,
      description:
        'The desired image dimensions.',
      defaultValue: 1,
      options: {
        disabled: false,
        options: [
          { value: 'square', label: 'square' },
          { value: 'landscape', label: 'landscape' },
          { value: 'portrait', label: 'portrait' }
        ],
      },
    }),
    description: Property.LongText({
      displayName: 'Description',
      required: true,
      description:
      'A detailed textual description of the image to be generated.',
    }),
  },
  async run({ auth, propsValue }) {
    const response = await httpClient.sendRequest<{
      data: {
        zip: string;
        images: string[];
        price: {
          price_per_image: number;
          quantity_images: number;
          total: number;
        };
      };
      success: boolean;
    }>({
      url: `${baseUrlv0}/image/generation`,
      method: HttpMethod.POST,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth as string,
      },
      body: {
        model: propsValue.model,
        description: propsValue.description,
        size: propsValue.size,
        variations: propsValue.variations
      },
    });

    return {
    images: response.body.data.images,
    zip: response.body.data.zip,
  };
  },
});
