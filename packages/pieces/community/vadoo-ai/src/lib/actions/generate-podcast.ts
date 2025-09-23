import { createAction, Property } from '@activepieces/pieces-framework';
import { vadooAiAuth } from '../../index';
import { httpClient, HttpMethod, propsValidation } from '@activepieces/pieces-common';
import { generatePodcastSchema } from '../schemas';

export const generatePodcast = createAction({
  auth: vadooAiAuth,
  name: 'generate_podcast',
  displayName: 'Generate Podcast',
  description: 'Generate a podcast-style video',
  props: {
    content_source: Property.StaticDropdown({
      displayName: 'Content Source',
      description: 'Choose the source of content for the podcast',
      required: true,
      options: {
        options: [
          { label: 'Website/PDF URL', value: 'url' },
          { label: 'Custom Text', value: 'text' }
        ]
      }
    }),
    url: Property.ShortText({
      displayName: 'Website/PDF URL',
      description: 'URL of the website or PDF to create a podcast from',
      required: false
    }),
    text: Property.LongText({
      displayName: 'Custom Content',
      description: 'Custom content for the podcast',
      required: false
    }),
    name1: Property.ShortText({
      displayName: 'Host Name',
      description: 'The host name for AI Podcast',
      required: true
    }),
    voice1: Property.ShortText({
      displayName: 'Host Voice',
      description: 'The host voice for AI Podcast',
      required: false,
      defaultValue: 'Onyx'
    }),
    name2: Property.ShortText({
      displayName: 'Guest Name',
      description: 'The guest name for AI Podcast',
      required: true
    }),
    voice2: Property.ShortText({
      displayName: 'Guest Voice',
      description: 'The guest voice for AI Podcast',
      required: false,
      defaultValue: 'Echo'
    }),
    theme: Property.ShortText({
      displayName: 'Theme',
      description: 'To display captions with style',
      required: false,
      defaultValue: 'Hormozi_1'
    }),
    language: Property.ShortText({
      displayName: 'Language',
      description: 'To generate video in language you want',
      required: false,
      defaultValue: 'English'
    }),
    duration: Property.StaticDropdown({
      displayName: 'Duration',
      description: 'Podcast Duration in minutes',
      required: false,
      defaultValue: '1-2',
      options: {
        options: [
          { label: '1-2 minutes', value: '1-2' },
          { label: '3-5 minutes', value: '3-5' }
        ]
      }
    }),
    tone: Property.ShortText({
      displayName: 'Tone',
      description: 'Tone of the Podcast',
      required: false,
      defaultValue: 'Friendly'
    })
  },
  async run(context) {
    // Validate props with Zod schema
    await propsValidation.validateZod(context.propsValue, generatePodcastSchema);

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
      tone
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
      name2: name2
    };

    if (url && content_source === 'url') requestBody['url'] = url;
    if (text && content_source === 'text') requestBody['text'] = text;
    if (voice1) requestBody['voice1'] = voice1;
    if (voice2) requestBody['voice2'] = voice2;
    if (theme) requestBody['theme'] = theme;
    if (language) requestBody['language'] = language;
    if (duration) requestBody['duration'] = duration;
    if (tone) requestBody['tone'] = tone;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://viralapi.vadoo.tv/api/generate_podcast',
      headers: {
        'X-API-KEY': context.auth,
        'Content-Type': 'application/json'
      },
      body: requestBody
    });

    return response.body;
  }
});
