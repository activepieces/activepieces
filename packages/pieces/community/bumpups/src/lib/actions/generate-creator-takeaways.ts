import { createAction, Property } from '@activepieces/pieces-framework';
import { BumpupsAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const generateCreatorTakeaways = createAction({
  auth: BumpupsAuth,
  name: 'generateCreatorTakeaways',
  displayName: 'Generate Creator Takeaways',
  description:
    'Generates key takeaways for a YouTube video based on its content.',
  props: {
    videoUrl: Property.ShortText({
      displayName: 'Video URL',
      description: 'The YouTube video URL.',
      required: true,
    }),
    model: Property.StaticDropdown({
      displayName: 'Model',
      required: true,
      defaultValue: 'bump-1.0',
      options: {
        disabled: false,
        options: [{ label: 'bump-1.0', value: 'bump-1.0' }],
      },
    }),
    language: Property.StaticDropdown({
      displayName: 'Language',
      required: false,
      defaultValue: 'en',
      options: {
        disabled: false,
        options: [
          { label: 'English (en)', value: 'en' },
          { label: 'Hindi (hi)', value: 'hi' },
          { label: 'Spanish (es)', value: 'es' },
          { label: 'Portuguese (pt)', value: 'pt' },
          { label: 'Russian (ru)', value: 'ru' },
          { label: 'German (de)', value: 'de' },
          { label: 'French (fr)', value: 'fr' },
          { label: 'Japanese (ja)', value: 'ja' },
          { label: 'Korean (ko)', value: 'ko' },
          { label: 'Arabic (ar)', value: 'ar' },
        ],
      },
    }),
    emojis_enabled: Property.Checkbox({
      displayName: 'Include Emojis',
      description: 'Whether to include emojis in the generated takeaways.',
      required: false,
      defaultValue: false,
    }),
  },
  async run({ auth, propsValue }) {
    const body: any = {
      url: propsValue.videoUrl,
      model: propsValue.model,
      language: propsValue.language || 'en',
      emojis_enabled: propsValue.emojis_enabled || false,
    };

    const response = await makeRequest(
      auth as string,
      HttpMethod.POST,
      '/creator/takeaways',
      body
    );
    return response;
  },
});
