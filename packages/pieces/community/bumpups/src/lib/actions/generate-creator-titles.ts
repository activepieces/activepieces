import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { bumpupsAuth } from '../..';

export const generateCreatorTitles = createAction({
  auth: bumpupsAuth,
  name: 'generateCreatorTitles',
  displayName: 'Generate Creator Titles',
  description: 'Generates title suggestions for a given YouTube video using the bump-1.0 model.',
  props: {
    url: Property.ShortText({
      displayName: 'Video URL',
      required: true,
      description: 'The YouTube video URL to generate titles for',
    }),
    model: Property.StaticDropdown({
      displayName: 'Model',
      required: true,
      description: 'The AI model to use for generating titles',
      options: {
        options: [
          { label: 'bump-1.0', value: 'bump-1.0' },
        ],
      },
    }),
    language: Property.StaticDropdown({
      displayName: 'Language',
      required: false,
      description: 'A two-letter language code for the response',
      options: {
        options: [
          { label: 'English', value: 'en' },
          { label: 'Hindi', value: 'hi' },
          { label: 'Spanish', value: 'es' },
          { label: 'Portuguese', value: 'pt' },
          { label: 'Russian', value: 'ru' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    const { url, model, language } = propsValue;

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: 'https://api.bumpups.com/creator/titles',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': auth,
        },
        body: {
          url,
          model: model || 'bump-1.0',
          language: language || 'en',
        },
      });

      return response.body;
    } catch (error) {
      throw new Error(`Bumpups API error: ${error}`);
    }
  },
});