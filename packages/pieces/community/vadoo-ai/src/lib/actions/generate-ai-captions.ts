import { createAction, Property } from '@activepieces/pieces-framework';
import { vadooAiAuth } from '../common/auth';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';

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
    const body = context.propsValue;

    return await makeRequest<{ vid: number }>(
      context.auth,
      HttpMethod.POST,
      '/add_captions',
      body
    );
  },
});