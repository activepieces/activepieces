import {
  httpClient,
  HttpMethod,
  propsValidation,
} from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { z } from 'zod';
import { joggAiAuth } from '../..';

export const createAiAvatarPhoto = createAction({
  name: 'createAiAvatarPhoto',
  displayName: 'Create AI Avatar Photo',
  description: 'Creates an AI avatar photo using JoggAI API',
  auth: joggAiAuth,
  props: {
    age: Property.StaticDropdown({
      displayName: 'Age',
      description: 'The age group for the avatar',
      required: true,
      options: {
        options: [
          { label: 'Teenager', value: 'Teenager' },
          { label: 'Young adult', value: 'Young adult' },
          { label: 'Adult', value: 'Adult' },
          { label: 'Elderly', value: 'Elderly' },
        ],
      },
    }),
    appearance: Property.LongText({
      displayName: 'Appearance',
      description: 'Description of the appearance',
      required: false,
    }),
    aspect_ratio: Property.StaticDropdown({
      displayName: 'Aspect Ratio',
      description: 'Photo aspect ratio',
      required: true,
      options: {
        options: [
          { label: 'Portrait [9:16]', value: 0 },
          { label: 'Landscape [16:9]', value: 1 },
        ],
      },
    }),
    avatar_style: Property.StaticDropdown({
      displayName: 'Avatar Style',
      description: 'Style of the avatar',
      required: true,
      options: {
        options: [
          { label: 'Professional', value: 'Professional' },
          { label: 'Social', value: 'Social' },
        ],
      },
    }),
    background: Property.LongText({
      displayName: 'Background',
      description: 'Description of the background',
      required: false,
    }),
    ethnicity: Property.StaticDropdown({
      displayName: 'Ethnicity',
      description: 'The ethnicity for the avatar',
      required: false,
      options: {
        options: [
          { label: 'European', value: 'European' },
          { label: 'African', value: 'African' },
          { label: 'South Asian', value: 'South Asian' },
          { label: 'East Asian', value: 'East Asian' },
          { label: 'Middle Eastern', value: 'Middle Eastern' },
          { label: 'South American', value: 'South American' },
          { label: 'North American', value: 'North American' },
        ],
      },
    }),
    gender: Property.StaticDropdown({
      displayName: 'Gender',
      description: 'The gender for the avatar',
      required: true,
      options: {
        options: [
          { label: 'Female', value: 'Female' },
          { label: 'Male', value: 'Male' },
        ],
      },
    }),
    image_url: Property.ShortText({
      displayName: 'Image URL',
      description: 'URL of an existing image to use as reference',
      required: false,
    }),
    model: Property.StaticDropdown({
      displayName: 'Model',
      description: 'The AI model to use',
      required: true,
      options: {
        options: [
          { label: 'Classic', value: 'classic' },
          { label: 'Modern', value: 'modern' },
        ],
      },
    }),
  },

  async run({ auth, propsValue }) {
    const {
      age,
      appearance,
      aspect_ratio,
      avatar_style,
      background,
      ethnicity,
      gender,
      image_url,
      model,
    } = propsValue;

    await propsValidation.validateZod(propsValue, {
      image_url: z.string().url('Image URL must be a valid URL').optional(),
      appearance: z
        .string()
        .min(1, 'Appearance description cannot be empty')
        .optional(),
      background: z
        .string()
        .min(1, 'Background description cannot be empty')
        .optional(),
    });

    const requestBody: {
      age: string;
      aspect_ratio: number;
      avatar_style: string;
      gender: string;
      model: string;
      appearance?: string;
      background?: string;
      ethnicity?: string;
      image_url?: string;
    } = {
      age,
      aspect_ratio,
      avatar_style,
      gender,
      model,
    };

    if (appearance) {
      requestBody.appearance = appearance;
    }
    if (background) {
      requestBody.background = background;
    }
    if (ethnicity) {
      requestBody.ethnicity = ethnicity;
    }
    if (image_url) {
      requestBody.image_url = image_url;
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.jogg.ai/v1/photo_avatar/photo/generate',
      headers: {
        'x-api-key': auth,
        'Content-Type': 'application/json',
      },
      body: requestBody,
    });

    if (response.body.code !== 0) {
      const errorMessages: Record<number, string> = {
        10104: 'Record not found',
        10105: 'Invalid API key',
        18020: 'Insufficient credit',
        18025: 'No permission to call APIs',
        40000: 'Parameter error',
        50000: 'System error',
      };

      const message =
        errorMessages[response.body.code] || `API Error: ${response.body.msg}`;
      throw new Error(message);
    }

    return response.body;
  },
});
