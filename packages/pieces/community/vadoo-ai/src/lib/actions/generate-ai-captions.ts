import { createAction, Property } from '@activepieces/pieces-framework';

export const generateAiCaptions = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'generateAiCaptions',
  displayName: 'Generate AI Captions',
  description: 'Generates AI captions.',
  props: {},
  async run() {
    // Action logic here
  },
});
