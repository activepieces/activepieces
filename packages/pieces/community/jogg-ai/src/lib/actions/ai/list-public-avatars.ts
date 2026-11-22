import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { joggAiAuth } from '../../..';
import { joggAiClient } from '../../common/client';
import { joggAiOutputSchemas } from '../../common/output-schemas';

export const aiListPublicAvatars = createAction({
  auth: joggAiAuth,
  name: 'ai_list_public_avatars',
  displayName: 'List Public Avatars',
  description: 'Lists JoggAI library avatars with optional filters.',
  audience: 'ai',
  classification: 'SEARCH',
  outputSchema: joggAiOutputSchemas.aiListPublicAvatars,
  aiMetadata: {
    description:
      'Lists the public JoggAI avatar library, one page at a time, filtered by gender, age, style, scene, ethnicity or aspect ratio. Use it to pick an avatar id for Create Avatar Video with avatar type public. An empty list means no more pages or no match. Read-only.',
    idempotent: true,
  },
  props: {
    page: Property.Number({
      displayName: 'Page',
      description: 'Page number, starting at 1.',
      required: false,
    }),
    page_size: Property.Number({
      displayName: 'Page Size',
      description: 'Items per page (1-100). Defaults to 20.',
      required: false,
    }),
    gender: Property.StaticDropdown({
      displayName: 'Gender',
      required: false,
      options: { options: [{ label: 'Female', value: 'female' }, { label: 'Male', value: 'male' }] },
    }),
    age: Property.StaticDropdown({
      displayName: 'Age',
      required: false,
      options: {
        options: [
          { label: 'Young adult', value: 'young_adult' },
          { label: 'Adult', value: 'adult' },
          { label: 'Senior', value: 'senior' },
        ],
      },
    }),
    style: Property.StaticDropdown({
      displayName: 'Style',
      required: false,
      options: { options: [{ label: 'Professional', value: 'professional' }, { label: 'Social', value: 'social' }] },
    }),
    scene: Property.StaticDropdown({
      displayName: 'Scene',
      required: false,
      options: {
        options: [
          { label: 'Lifestyle', value: 'lifestyle' },
          { label: 'Outdoors', value: 'outdoors' },
          { label: 'Business', value: 'business' },
          { label: 'Studio', value: 'studio' },
          { label: 'Health & fitness', value: 'health_fitness' },
          { label: 'Education', value: 'education' },
          { label: 'News', value: 'news' },
        ],
      },
    }),
    ethnicity: Property.StaticDropdown({
      displayName: 'Ethnicity',
      required: false,
      options: {
        options: [
          { label: 'European', value: 'european' },
          { label: 'African', value: 'african' },
          { label: 'South Asian', value: 'south_asian' },
          { label: 'East Asian', value: 'east_asian' },
          { label: 'Middle Eastern', value: 'middle_eastern' },
          { label: 'South American', value: 'south_american' },
          { label: 'North American', value: 'north_american' },
        ],
      },
    }),
    aspect_ratio: Property.StaticDropdown({
      displayName: 'Aspect Ratio',
      required: false,
      options: {
        options: [
          { label: 'Portrait (9:16)', value: 'portrait' },
          { label: 'Landscape (16:9)', value: 'landscape' },
          { label: 'Square (1:1)', value: 'square' },
        ],
      },
    }),
  },
  async run(context) {
    const { page, page_size, gender, age, style, scene, ethnicity, aspect_ratio } = context.propsValue;
    const data = await joggAiClient.request({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      path: '/v2/avatars/public',
      op: 'list public avatars',
      queryParams: {
        ...joggAiClient.pageParams({ page, pageSize: page_size }),
        ...joggAiClient.compact({ gender, age, style, scene, ethnicity, aspect_ratio }),
      },
    });
    return { avatars: joggAiClient.listOf({ value: data, key: 'avatars' }) };
  },
});
