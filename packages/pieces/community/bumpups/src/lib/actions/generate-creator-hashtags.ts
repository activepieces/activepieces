import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { bumpupsAuth } from '../..';

export const generateCreatorHashtags = createAction({
  auth: bumpupsAuth,
  name: 'generateCreatorHashtags',
  displayName: 'Generate Creator Hashtags',
  description: 'Generates hashtags for a given YouTube video using the bump-1.0 model.',
  props: {
    url: Property.ShortText({
      displayName: 'Video URL',
      required: true,
      description: 'The YouTube video URL to generate hashtags for',
    }),
    model: Property.StaticDropdown({
      displayName: 'Model',
      required: true,
      description: 'The AI model to use for generating hashtags',
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
    outputFormat: Property.StaticDropdown({
      displayName: 'Output Format',
      required: false,
      description: 'Whether to output as hashtags or as plain keywords',
      options: {
        options: [
          { label: 'Hashtags', value: 'hashtags' },
          { label: 'Keywords', value: 'keywords' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    const { url, model, language, outputFormat } = propsValue;

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: 'https://api.bumpups.com/creator/hashtags',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': auth,
        },
        body: {
          url,
          model: model || 'bump-1.0',
          language: language || 'en',
          output_format: outputFormat || 'hashtags',
        },
      });

      return response.body;
    } catch (error) {
      throw new Error(`Bumpups API error: ${error}`);
    }
  },
});