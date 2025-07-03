import { createAction, Property } from '@activepieces/pieces-framework';

export const sendSms = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'sendSms',
  displayName: 'Send SMS',
  description: '',
  props: {},
  async run() {
    // Action logic here
  },
});
