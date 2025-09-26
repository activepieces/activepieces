import { createAction, Property } from '@activepieces/pieces-framework';

export const closeChat = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'closeChat',
  displayName: 'Close Chat',
  description: 'Programmatically mark a chat as closed by its chat_id.',
  props: {},
  async run() {
    // Action logic here
  },
});
