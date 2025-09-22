import { createAction, Property } from '@activepieces/pieces-framework';

export const createText-to-sound = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'createText-to-sound',
  displayName: 'Create Text-to-Sound',
  description: 'Convert input text into “sound effects” using an AI model.',
  props: {},
  async run() {
    // Action logic here
  },
});
