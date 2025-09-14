import { createAction, Property } from '@activepieces/pieces-framework';

export const sendChat = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'sendChat',
  displayName: 'Send Chat',
  description: 'Send a message to Bumpups with a video URL, prompt, model, etc; receive a generated response.',
  props: {},
  async run() {
    // Action logic here
  },
});
