import { straicoAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';

import { baseUrl } from '../common/common';

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
        images: Array<string>[],
        zip: string
    };
    }>({
      url: `${baseUrl}/image/generation`,
      method: HttpMethod.POST,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth as string,
      },
      body: {
        model: 'openai/dall-e-3',
        description: propsValue.description,
        size: propsValue.size,
        variations: propsValue.variations,
      },
    });

    return response.body.data;
  },
});
