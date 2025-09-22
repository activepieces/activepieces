import { createAction, Property } from '@activepieces/pieces-framework';

export const generatePodcast = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'generatePodcast',
  displayName: 'Generate Podcast',
  description: 'Generate a podcast-style video.',
  props: {},
  async run() {
    // Action logic here
  },
});
