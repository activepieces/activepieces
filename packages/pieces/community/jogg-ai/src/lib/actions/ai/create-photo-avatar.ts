import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { joggAiAuth } from '../../..';
import { joggAiClient } from '../../common/client';
import { joggAiOutputSchemas } from '../../common/output-schemas';

export const aiCreatePhotoAvatar = createAction({
  auth: joggAiAuth,
  name: 'ai_create_photo_avatar',
  displayName: 'Create Photo Avatar',
  description: 'Starts generating AI avatar photos from a description.',
  audience: 'ai',
  classification: 'WRITE',
  outputSchema: joggAiOutputSchemas.aiCreatePhotoAvatar,
  aiMetadata: {
    description:
      'Starts generating AI avatar photos on JoggAI from traits (age, gender, style, model, aspect ratio) plus optional ethnicity, appearance and background text or a reference image URL, and returns a photo_id. Generation is async and spends credits: poll Get Photo Avatar Status with the photo_id. Not idempotent: every call starts and bills a new generation.',
    idempotent: false,
  },
  props: {
    age: Property.StaticDropdown({
      displayName: 'Age',
      required: true,
      options: {
        options: ['Teenager', 'Young adult', 'Adult', 'Elderly'].map((value) => ({ label: value, value })),
      },
    }),
    gender: Property.StaticDropdown({
      displayName: 'Gender',
      required: true,
      options: { options: ['Female', 'Male'].map((value) => ({ label: value, value })) },
    }),
    avatar_style: Property.StaticDropdown({
      displayName: 'Avatar Style',
      required: true,
      options: { options: ['Professional', 'Social'].map((value) => ({ label: value, value })) },
    }),
    model: Property.StaticDropdown({
      displayName: 'Model',
      required: true,
      options: {
        options: [
          { label: 'Classic', value: 'classic' },
          { label: 'Modern', value: 'modern' },
        ],
      },
    }),
    aspect_ratio: Property.StaticDropdown({
      displayName: 'Aspect Ratio',
      description: 'Defaults to portrait.',
      required: false,
      options: {
        options: [
          { label: 'Portrait (9:16)', value: 'portrait' },
          { label: 'Landscape (16:9)', value: 'landscape' },
          { label: 'Square (1:1)', value: 'square' },
        ],
      },
    }),
    ethnicity: Property.StaticDropdown({
      displayName: 'Ethnicity',
      required: false,
      options: {
        options: [
          'European',
          'African',
          'South Asian',
          'East Asian',
          'Middle Eastern',
          'South American',
          'North American',
        ].map((value) => ({ label: value, value })),
      },
    }),
    appearance: Property.LongText({
      displayName: 'Appearance',
      description: 'Free-text description of the look, e.g. short brown hair, glasses.',
      required: false,
    }),
    background: Property.LongText({
      displayName: 'Background',
      description: 'Free-text description of the background.',
      required: false,
    }),
    image_url: Property.ShortText({
      displayName: 'Reference Image URL',
      description: 'Optional public URL of a reference photo.',
      required: false,
    }),
  },
  async run(context) {
    const { age, gender, avatar_style, model, aspect_ratio, ethnicity, appearance, background, image_url } =
      context.propsValue;
    const data = await joggAiClient.request({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/v2/photo_avatar/photo/generate',
      op: 'create photo avatar',
      body: {
        age,
        gender,
        avatar_style,
        model,
        aspect_ratio: aspect_ratio ?? 'portrait',
        ...joggAiClient.compact({ ethnicity, appearance, background, image_url }),
      },
    });
    return { photo_id: data['photo_id'] ?? null };
  },
});
