import { createAction, Property } from '@activepieces/pieces-framework';

export const sendMessageToNewChat = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'sendMessageToNewChat',
  displayName: 'Send Message to New Chat',
  description: 'Create a new chat (new conversation) by specifying the WhatsApp account, phone number, and message.',
  props: {},
  async run() {
    // Action logic here
  },
});
