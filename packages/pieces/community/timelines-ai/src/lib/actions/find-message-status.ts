import { createAction, Property } from '@activepieces/pieces-framework';

export const findMessageStatus = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'findMessageStatus',
  displayName: 'Find Message Status',
  description: 'Lookup a message’s delivery status by message ID.',
  props: {},
  async run() {
    // Action logic here
  },
});
