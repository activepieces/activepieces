import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { tunovaAuth } from '../common/auth';
import { tunovaRequest } from '../common/client';

export const generateLyrics = createAction({
  auth: tunovaAuth,
  name: 'generate_lyrics',
  displayName: 'Generate Lyrics',
  description: 'Generate song lyrics from a theme or brief. Synchronous.',
  props: {
    prompt: Property.LongText({
      displayName: 'Prompt',
      description: 'The theme or brief for the lyrics.',
      required: true,
    }),
  },
  async run(context) {
    return tunovaRequest(context.auth.props.apiKey, HttpMethod.POST, '/api/lyrics', {
      prompt: context.propsValue.prompt,
    });
  },
});
