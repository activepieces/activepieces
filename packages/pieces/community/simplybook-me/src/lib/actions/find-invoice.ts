import { createAction, Property } from '@activepieces/pieces-framework';

export const findInvoice = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'findInvoice',
  displayName: 'Find Invoice',
  description: 'Find an existing invoice.',
  props: {},
  async run() {
    // Action logic here
  },
});
