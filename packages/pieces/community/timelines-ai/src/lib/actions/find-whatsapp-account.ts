import { createAction, Property } from '@activepieces/pieces-framework';

export const findWhatsappAccount = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'findWhatsappAccount',
  displayName: 'Find WhatsApp Account',
  description: 'Search for a WhatsApp account (by phone or ID).',
  props: {},
  async run() {
    // Action logic here
  },
});
