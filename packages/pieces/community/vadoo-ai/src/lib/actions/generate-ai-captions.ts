import { createAction, Property } from '@activepieces/pieces-framework';
import { vadooAiAuth } from '../../index';
import { httpClient, HttpMethod, propsValidation } from '@activepieces/pieces-common';
import { generateAiCaptionsSchema } from '../schemas';

export const generateAiCaptions = createAction({
  auth: vadooAiAuth,
  name: 'generate_ai_captions',
  displayName: 'Generate AI Captions',
  description: 'Generates AI captions for a video',
  props: {
    url: Property.ShortText({
      displayName: 'Video URL',
      description: 'URL of the input video to add captions to',
      required: true
    }),
    theme: Property.ShortText({
      displayName: 'Theme',
      description: 'To display captions with style',
      required: false,
      defaultValue: 'Hormozi_1'
    }),
    language: Property.ShortText({
      displayName: 'Language',
      description: 'To generate captions in language you want',
      required: false,
      defaultValue: 'English'
    })
  },
  async run(context) {
    // Validate props with Zod schema
    await propsValidation.validateZod(context.propsValue, generateAiCaptionsSchema);

    const { url, theme, language } = context.propsValue;

    // Build request body, only including non-empty values
    const requestBody: Record<string, any> = {
      url: url
    };

    if (theme) requestBody['theme'] = theme;
    if (language) requestBody['language'] = language;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://viralapi.vadoo.tv/api/add_captions',
      headers: {
        'X-API-KEY': context.auth,
        'Content-Type': 'application/json'
      },
      body: requestBody
    });

    return response.body;
  }
});