import { straicoAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';

import { baseUrlv0, baseUrlv1 } from '../common/common';

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
    model: Property.Dropdown({
      displayName: 'Model',
      required: true,
      description: 'Select the image generation model.',
      defaultValue: 'openai/dall-e-3',
      refreshers: ['auth'],
      refreshOnSearch: true,
      options: async ({ auth }, { searchValue }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
          };
        }
        try {
          const response = await httpClient.sendRequest<{
            data: { image?: { name?: string; model: string }[] };
            success: boolean;
          }>({
            url: `${baseUrlv1}/models`,
            method: HttpMethod.GET,
            authentication: {
              type: AuthenticationType.BEARER_TOKEN,
              token: auth as string,
            },
          });

          const models = response.body?.data?.image ?? [];
          const filtered = searchValue
            ? models.filter((m) => {
                const term = String(searchValue).toLowerCase();
                return (
                  (m.name ?? '').toLowerCase().includes(term) ||
                  m.model.toLowerCase().includes(term)
                );
              })
            : models;

          return {
            disabled: false,
            options: filtered.map((m) => ({
              label: m.name ?? m.model,
              value: m.model,
            })),
          };
        } catch (e) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Failed to load models. Check API key and try again.',
          };
        }
      },
    }),
    size: Property.StaticDropdown({
      displayName: 'Image Dimensions',
      required: true,
      description:
        'The desired image dimensions.',
      defaultValue: 'square',
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
