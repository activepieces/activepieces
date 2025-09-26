import { createAction, Property } from '@activepieces/pieces-framework';

export const sendMessageToExistingChat = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'sendMessageToExistingChat',
  displayName: 'Send Message to Existing Chat',
  description: 'Sends a text message in a chat identified by chat_id',
  props: {},
  async run() {
    // Action logic here
  },
});
