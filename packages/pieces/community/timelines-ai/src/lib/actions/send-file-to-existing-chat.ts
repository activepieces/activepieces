import { createAction, Property } from '@activepieces/pieces-framework';

export const sendFileToExistingChat = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'sendFileToExistingChat',
  displayName: 'Send File to Existing Chat',
  description: 'Similar to above: send a file attachment to a chat using URL or file input and name.',
  props: {},
  async run() {
    // Action logic here
  },
});
