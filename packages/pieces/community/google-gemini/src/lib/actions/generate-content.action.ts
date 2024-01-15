import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { googleGeminiAuth } from '../../index';
import { Property, createAction } from '@activepieces/pieces-framework';

export const generateContentAction = createAction({
  description:
    'Generate content using Google Gemini using the "gemini-pro" model',
  displayName: 'Generate Content',
  name: 'generate_content',
  auth: googleGeminiAuth,
  props: {
    prompt: Property.LongText({
      displayName: 'Prompt',
      required: true,
      description: 'The prompt to generate content from.',
    }),
  },
  async run({ auth, propsValue }) {
    const request = await httpClient.sendRequest<
      { id: string; name: string }[]
    >({
      method: HttpMethod.POST,
      url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${auth}`,
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        contents: [
          {
            parts: [
              {
                text: propsValue.prompt,
              },
            ],
          },
        ],
      },
    });
    return request.body;
  },
});
