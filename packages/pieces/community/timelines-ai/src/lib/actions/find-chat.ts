import { createAction, Property } from '@activepieces/pieces-framework';

export const findChat = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'findChat',
  displayName: 'Find Chat',
  description: 'Look up a chat by parameters such as chat_id, phone, name, etc.',
  props: {},
  async run() {
    // Action logic here
  },
});
