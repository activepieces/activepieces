import { createAction, Property } from '@activepieces/pieces-framework';

export const transfer = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'transfer',
  displayName: 'Transfer to bank',
  description: 'Transfer balance to other wallet',
  props: {},
  async run() {
    console.log('transfer action');
    // Action logic here
    return {
      success: true,
      message: 'Transfer action',
    };
  },
});
