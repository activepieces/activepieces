import { createAction, Property } from '@activepieces/pieces-framework';

export const findMessage = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'findMessage',
  displayName: 'Find Message',
  description: 'Lookup a message by its WhatsApp message ID.',
  props: {},
  async run() {
    // Action logic here
  },
});
