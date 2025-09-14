import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { bumpupsAuth } from '../..';

export const sendChat = createAction({
  auth: bumpupsAuth,
  name: 'sendChat',
  displayName: 'Send Chat',
  description: 'Send a message to Bumpups with a video URL, prompt, model, etc; receive a generated response.',
  props: {
    url: Property.ShortText({
      displayName: 'Video URL',
      required: true,
      description: 'The URL of the video to analyze (YouTube, Vimeo, etc.)',
    }),
    prompt: Property.LongText({
      displayName: 'Prompt',
      required: true,
      description: 'The question or instruction for Bumpups to process',
    }),
    model: Property.StaticDropdown({
      displayName: 'Model',
      required: true,
      description: 'The AI model to use for processing',
      options: {
        options: [
          { label: 'bump-1.0', value: 'bump-1.0' },
        ],
      },
    }),
    language: Property.StaticDropdown({
      displayName: 'Language',
      required: false,
      description: 'The language for the output',
      options: {
        options: [
          { label: 'English', value: 'en' },
          { label: 'Spanish', value: 'es' },
          { label: 'French', value: 'fr' },
          { label: 'German', value: 'de' },
          { label: 'Italian', value: 'it' },
          { label: 'Portuguese', value: 'pt' },
          { label: 'Chinese', value: 'zh' },
          { label: 'Japanese', value: 'ja' },
          { label: 'Korean', value: 'ko' },
          { label: 'Arabic', value: 'ar' },
          { label: 'Russian', value: 'ru' },
          { label: 'Hindi', value: 'hi' },
        ],
      },
    }),
    outputFormat: Property.StaticDropdown({
      displayName: 'Output Format',
      required: false,
      description: 'The format of the output response',
      options: {
        options: [
          { label: 'Text', value: 'text' },
          { label: 'JSON', value: 'json' },
          { label: 'Markdown', value: 'markdown' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    const { url, prompt, model, language, outputFormat } = propsValue;

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: 'https://api.bumpups.com/chat',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': auth,
        },
        body: {
          url,
          model,
          prompt,
          language: language || 'en',
          output_format: outputFormat || 'text',
        },
      });

      return response.body;
    } catch (error) {
      throw new Error(`Bumpups API error: ${error}`);
    }
  },
});