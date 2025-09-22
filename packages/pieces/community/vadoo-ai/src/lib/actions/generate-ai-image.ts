import { createAction, Property } from '@activepieces/pieces-framework';

export const generateAiImage = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'generateAiImage',
  displayName: 'Generate AI Image',
  description: 'Generates Ai generated image based on prompt.',
  props: {},
  async run() {
    // Action logic here
  },
});
