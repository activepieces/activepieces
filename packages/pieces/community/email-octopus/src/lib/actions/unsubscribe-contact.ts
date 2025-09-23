import { createAction, Property } from '@activepieces/pieces-framework';

export const unsubscribeContact = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'unsubscribeContact',
  displayName: 'Unsubscribe Contact',
  description: 'Remove a contact from a list (unsubscribe).',
  props: {},
  async run() {
    // Action logic here
  },
});
