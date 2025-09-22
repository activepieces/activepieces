import { createAction, Property } from '@activepieces/pieces-framework';
import { vadooAiAuth } from '../common/auth';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';

export const generatePodcast = createAction({
  auth: vadooAiAuth,
  name: 'generate_podcast',
  displayName: 'Generate Podcast',
  description: 'Generate a podcast-style video from a URL or custom text.',
  props: {
    url: Property.ShortText({
        displayName: 'Source URL',
        description: 'URL of a website or PDF to create the podcast from. Optional if using the "Custom Content" field.',
        required: false,
    }),
    text: Property.LongText({
        displayName: 'Custom Content (Text)',
        description: 'Custom text or script for the podcast. Optional if using the "Source URL" field.',
        required: false,
    }),
    name1: Property.ShortText({
        displayName: 'Host Name',
        description: 'The name of the podcast host.',
        required: true,
    }),
    voice1: Property.ShortText({
        displayName: 'Host Voice',
        description: 'The voice for the podcast host (e.g., "Onyx"). Defaults to Onyx.',
        required: false,
    }),
    name2: Property.ShortText({
        displayName: 'Guest Name',
        description: 'The name of the podcast guest.',
        required: true,
    }),
    voice2: Property.ShortText({
        displayName: 'Guest Voice',
        description: 'The voice for the podcast guest (e.g., "Echo"). Defaults to Echo.',
        required: false,
    }),
    duration: Property.StaticDropdown({
        displayName: 'Podcast Duration',
        description: 'The target duration of the podcast in minutes.',
        required: false,
        options: {
            options: [
                { label: '1-2 Minutes', value: '1-2' },
                { label: '3-5 Minutes', value: '3-5' },
            ]
        }
    }),
    theme: Property.ShortText({
        displayName: 'Captions Theme',
        description: 'The style for the video\'s captions (e.g., "Hormozi_1").',
        required: false,
    }),
    language: Property.ShortText({
        displayName: 'Language',
        description: 'The language for the podcast generation (e.g., "English").',
        required: false,
    }),
    tone: Property.ShortText({
        displayName: 'Tone',
        description: 'The desired tone of the podcast (e.g., "Friendly").',
        required: false,
    }),
  },
  async run(context) {
    // The props are directly compatible with the API body, so we can pass them as is.
    const body = context.propsValue;

    return await makeRequest<{ vid: number }>(
      context.auth,
      HttpMethod.POST,
      '/generate_podcast',
      body
    );
  },
});