import { createAction, Property } from '@activepieces/pieces-framework';

export const getYoutubeSummary = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'getYoutubeSummary',
  displayName: 'Get YouTube Summary',
  description: 'Generate an AI-powered summary of the content of a YouTube video.',
  props: {},
  async run() {
    // Action logic here
  },
});
