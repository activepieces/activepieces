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
    theme: Property.Dropdown({
      displayName: 'Theme',
      description: 'To display captions with style',
      required: false,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please authenticate first'
          };
        }

        try {
          const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: 'https://viralapi.vadoo.tv/api/get_themes',
            headers: {
              'X-API-KEY': auth as string
            }
          });

          const themes = response.body as string[];
          return {
            disabled: false,
            options: themes.map(theme => ({
              label: theme,
              value: theme
            }))
          };
        } catch (error) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Failed to load themes'
          };
        }
      }
    }),
    language: Property.Dropdown({
      displayName: 'Language',
      description: 'To generate captions in language you want',
      required: false,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please authenticate first'
          };
        }

        try {
          const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: 'https://viralapi.vadoo.tv/api/get_languages',
            headers: {
              'X-API-KEY': auth as string
            }
          });

          const languages = response.body as string[];
          return {
            disabled: false,
            options: languages.map(language => ({
              label: language,
              value: language
            }))
          };
        } catch (error) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Failed to load languages'
          };
        }
      }
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