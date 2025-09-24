import { createAction, Property } from '@activepieces/pieces-framework';
import { BumpupsAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const generateTimestamps = createAction({
  auth: BumpupsAuth,
  name: 'generateTimestamps',
  displayName: 'Generate Timestamps',
  description: 'Generates detailed timestamps for a YouTube video based on its content.',
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
        options: [
          { label: 'bump-1.0', value: 'bump-1.0' },
        ],
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
    timestamps_style: Property.StaticDropdown({
      displayName: 'Timestamps Style',
      description: 'Preferred length of each timestamp.',
      required: false,
      defaultValue: 'long',
      options: {
        disabled: false,
        options: [
          { label: 'Long', value: 'long' },
          { label: 'Short', value: 'short' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    const body = {
      url: propsValue.videoUrl,
      model: propsValue.model,
      language: propsValue.language || 'en',
      timestamps_style: propsValue.timestamps_style || 'long',
    };

    const response = await makeRequest(
      auth as string,
      HttpMethod.POST,
      '/general/timestamps',
      body
    );

    return response;
  },
});
