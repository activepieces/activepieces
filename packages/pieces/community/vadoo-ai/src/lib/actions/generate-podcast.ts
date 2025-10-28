import { createAction, Property } from '@activepieces/pieces-framework';
import { vadooAiAuth } from '../../index';
import {
  httpClient,
  HttpMethod,
  propsValidation,
} from '@activepieces/pieces-common';
import { generatePodcastSchema } from '../schemas';
import { isEmpty } from '@activepieces/shared';

export const generatePodcast = createAction({
  auth: vadooAiAuth,
  name: 'generate_podcast',
  displayName: 'Generate Podcast',
  description: 'Generates a podcast-style video.',
  props: {
    content_source: Property.StaticDropdown({
      displayName: 'Content Source',
      description: 'Choose the source of content for the podcast',
      required: true,
      options: {
        options: [
          { label: 'Website/PDF URL', value: 'url' },
          { label: 'Custom Text', value: 'text' },
        ],
      },
    }),
    url: Property.ShortText({
      displayName: 'Website/PDF URL',
      description: 'URL of the website or PDF to create a podcast from',
      required: false,
    }),
    text: Property.LongText({
      displayName: 'Custom Content',
      description: 'Custom content for the podcast',
      required: false,
    }),
    name1: Property.ShortText({
      displayName: 'Host Name',
      description: 'The host name for AI Podcast',
      required: true,
    }),
    voice1: Property.Dropdown({
      displayName: 'Host Voice',
      description: 'The host voice for AI Podcast',
      required: false,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please authenticate first',
          };
        }

        try {
          const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: 'https://viralapi.vadoo.tv/api/get_voices',
            headers: {
              'X-API-KEY': auth as string,
            },
            timeout: 10000, // 10 second timeout
          });

          if (response.body && Array.isArray(response.body)) {
            const voices = response.body as string[];
            return {
              disabled: false,
              options: voices.map((voice) => ({
                label: voice,
                value: voice,
              })),
            };
          } else {
            // Fallback to default voices if API response is unexpected
            return {
              disabled: false,
              options: [
                { label: 'Charlie', value: 'Charlie' },
                { label: 'George', value: 'George' },
                { label: 'Callum', value: 'Callum' },
                { label: 'Sarah', value: 'Sarah' },
                { label: 'Laura', value: 'Laura' },
                { label: 'Charlotte', value: 'Charlotte' },
              ],
            };
          }
        } catch (error) {
          // Fallback to default voices on error
          return {
            disabled: false,
            options: [
              { label: 'Charlie', value: 'Charlie' },
              { label: 'George', value: 'George' },
              { label: 'Callum', value: 'Callum' },
              { label: 'Sarah', value: 'Sarah' },
              { label: 'Laura', value: 'Laura' },
              { label: 'Charlotte', value: 'Charlotte' },
            ],
          };
        }
      },
    }),
    name2: Property.ShortText({
      displayName: 'Guest Name',
      description: 'The guest name for AI Podcast',
      required: true,
    }),
    voice2: Property.Dropdown({
      displayName: 'Guest Voice',
      description: 'The guest voice for AI Podcast',
      required: false,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please authenticate first',
          };
        }

        try {
          const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: 'https://viralapi.vadoo.tv/api/get_voices',
            headers: {
              'X-API-KEY': auth as string,
            },
            timeout: 10000, // 10 second timeout
          });

          if (response.body && Array.isArray(response.body)) {
            const voices = response.body as string[];
            return {
              disabled: false,
              options: voices.map((voice) => ({
                label: voice,
                value: voice,
              })),
            };
          } else {
            // Fallback to default voices if API response is unexpected
            return {
              disabled: false,
              options: [
                { label: 'Charlie', value: 'Charlie' },
                { label: 'George', value: 'George' },
                { label: 'Callum', value: 'Callum' },
                { label: 'Sarah', value: 'Sarah' },
                { label: 'Laura', value: 'Laura' },
                { label: 'Charlotte', value: 'Charlotte' },
              ],
            };
          }
        } catch (error) {
          // Fallback to default voices on error
          return {
            disabled: false,
            options: [
              { label: 'Charlie', value: 'Charlie' },
              { label: 'George', value: 'George' },
              { label: 'Callum', value: 'Callum' },
              { label: 'Sarah', value: 'Sarah' },
              { label: 'Laura', value: 'Laura' },
              { label: 'Charlotte', value: 'Charlotte' },
            ],
          };
        }
      },
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
            placeholder: 'Please authenticate first',
          };
        }

        try {
          const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: 'https://viralapi.vadoo.tv/api/get_themes',
            headers: {
              'X-API-KEY': auth as string,
            },
          });

          const themes = response.body as string[];
          return {
            disabled: false,
            options: themes.map((theme) => ({
              label: theme,
              value: theme,
            })),
          };
        } catch (error) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Failed to load themes',
          };
        }
      },
    }),
    language: Property.Dropdown({
      displayName: 'Language',
      description: 'To generate video in language you want',
      required: false,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please authenticate first',
          };
        }

        try {
          const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: 'https://viralapi.vadoo.tv/api/get_languages',
            headers: {
              'X-API-KEY': auth as string,
            },
          });

          const languages = response.body as string[];
          return {
            disabled: false,
            options: languages.map((language) => ({
              label: language,
              value: language,
            })),
          };
        } catch (error) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Failed to load languages',
          };
        }
      },
    }),
    duration: Property.StaticDropdown({
      displayName: 'Duration',
      description: 'Podcast Duration in minutes',
      required: false,
      defaultValue: '1-2',
      options: {
        options: [
          { label: '1-2 minutes', value: '1-2' },
          { label: '3-5 minutes', value: '3-5' },
        ],
      },
    }),
    tone: Property.ShortText({
      displayName: 'Tone',
      description: 'Tone of the Podcast',
      required: false,
      defaultValue: 'Friendly',
    }),
  },
  async run(context) {
    // Validate props with Zod schema
    await propsValidation.validateZod(
      context.propsValue,
      generatePodcastSchema
    );

    const {
      content_source,
      url,
      text,
      name1,
      voice1,
      name2,
      voice2,
      theme,
      language,
      duration,
      tone,
    } = context.propsValue;

    // Validate content source requirements
    if (content_source === 'url' && !url) {
      throw new Error(
        "URL is required when content source is 'Website/PDF URL'"
      );
    }
    if (content_source === 'text' && !text) {
      throw new Error(
        "Custom text is required when content source is 'Custom Text'"
      );
    }

    // Build request body, only including non-empty values
    const requestBody: Record<string, any> = {
      name1: name1,
      name2: name2,
    };

    if (url && content_source === 'url') requestBody['url'] = url;
    if (text && content_source === 'text') requestBody['text'] = text;
    if (voice1) requestBody['voice1'] = voice1;
    if (voice2) requestBody['voice2'] = voice2;
    if (theme) requestBody['theme'] = theme;
    if (language) requestBody['language'] = language;
    if (duration) requestBody['duration'] = duration;
    if (tone) requestBody['tone'] = tone;

    const response = await httpClient.sendRequest<{ vid: number }>({
      method: HttpMethod.POST,
      url: 'https://viralapi.vadoo.tv/api/generate_podcast',
      headers: {
        'X-API-KEY': context.auth,
        'Content-Type': 'application/json',
      },
      body: requestBody,
    });

    if (isEmpty(response.body) || isEmpty(response.body.vid)) {
      throw new Error('Failed to generate podcast.');
    }

    const videoId = response.body.vid;
    let status = 'pending';
    const timeoutAt = Date.now() + 5 * 60 * 1000;

    do {
      await new Promise((resolve) => setTimeout(resolve, 5000));
      const pollRes = await httpClient.sendRequest<{
        url: string;
        status: string;
      }>({
        method: HttpMethod.GET,
        url: 'https://viralapi.vadoo.tv/api/get_video_url',
        headers: {
          'X-API-KEY': context.auth,
          'Content-Type': 'application/json',
        },
        queryParams: {
          id: videoId.toString(),
        },
      });

      status = pollRes.body.status;
      if (status === 'complete') return pollRes.body;
    } while (status !== 'complete' && Date.now() < timeoutAt);

    throw new Error('Generate Podcast timed out or failed.');
  },
});
