import { straicoAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';

import { baseUrlv0, baseUrlv1 } from '../common/common';

export const imageGeneration = createAction({
  audience: 'both',
  auth: straicoAuth,
  name: 'image_generation',
  displayName: 'Image Generation',
  description: 'Create images from a text description.',
  aiMetadata: { description: 'Generates one to four new images from a text description using a Straico image model such as DALL-E 3, in square, landscape or portrait shape, and returns their hosted URLs plus a zip. This is the only image-producing action in the piece; use Ask AI instead when the goal is text, including describing or reasoning about an image that has already been uploaded. Requires a model, a size, an image count and a detailed description; each generated image is billed separately. Not idempotent: every call renders fresh images even for an identical prompt.', idempotent: false },
  props: {
    variations: Property.StaticDropdown({
      displayName: 'Number of Images',
      required: true,
      description: 'How many images to create. Each one is billed.',
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
  auth: straicoAuth,

      displayName: 'Model',
      required: true,
      description: 'The Straico image model.',
      defaultValue: 'openai/dall-e-3',
      refreshers: ['auth'],
      refreshOnSearch: true,
      options: async ({ auth }, { searchValue }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your Straico account first',
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
              token: auth.secret_text,
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
      displayName: 'Shape',
      required: true,
      description: "The image's aspect ratio.",
      defaultValue: 'square',
      display: 'cards',
      options: {
        disabled: false,
        options: [
          { value: 'square', label: 'Square', description: '1:1' },
          { value: 'landscape', label: 'Landscape', description: 'Wide' },
          { value: 'portrait', label: 'Portrait', description: 'Tall' }
        ],
      },
    }),
    description: Property.LongText({
      displayName: 'Description',
      required: true,
      description: 'What the image should show, in as much detail as you like.',
      placeholder: 'e.g. A watercolor fox in a snowy forest at dawn',
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
        token: auth.secret_text,
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
