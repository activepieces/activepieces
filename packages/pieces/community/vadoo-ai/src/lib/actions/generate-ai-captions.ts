import { createAction, Property } from '@activepieces/pieces-framework';
import { vadooAiAuth } from '../common/auth';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

const BASE_URL = "https://viralapi.vadoo.tv/api";

export const generateAiCaptions = createAction({
  auth: vadooAiAuth,
  name: 'add_captions',
  displayName: 'Generate AI Captions',
  description: 'Adds AI-generated captions to an existing video from a URL.',
  props: {
    url: Property.ShortText({
        displayName: 'Video URL',
        description: 'The direct URL of the video to which you want to add captions.',
        required: true,
    }),
    theme: Property.ShortText({
        displayName: 'Captions Theme',
        description: 'The style for the video\'s captions (e.g., "Hormozi_1").',
        required: false,
    }),
    language: Property.ShortText({
        displayName: 'Language',
        description: 'The language for the caption generation (e.g., "English").',
        required: false,
    }),
  },
  async run(context) {
    const { url, theme, language } = context.propsValue;
    const { apiKey } = context.auth;

    // This body is built conditionally to prevent server errors.
    // Optional fields (theme, language) are only added if they have a value.
    const body: Record<string, unknown> = { url };
    if (theme) body['theme'] = theme;
    if (language) body['language'] = language;

    const response = await httpClient.sendRequest<{ vid: number }>({
        method: HttpMethod.POST,
        url: `${BASE_URL}/add_captions`,
        headers: {
            'X-API-KEY': apiKey,
        },
        body: body,
    });

    return response.body;
  },
});
