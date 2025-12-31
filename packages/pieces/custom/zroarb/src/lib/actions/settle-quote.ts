import { createAction } from '@activepieces/pieces-framework';

export const settleQuote = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'settleQuote',
  displayName: 'Settle Quote',
  description: 'Settle quotation',
  props: {},
  async run() {
    // Action logic here
    console.log('settle quote action');
    return {
      success: true,
      message: 'Quote settled successfully',
    };
  },
});
