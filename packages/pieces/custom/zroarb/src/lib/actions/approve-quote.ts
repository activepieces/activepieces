import { createAction } from '@activepieces/pieces-framework';

export const approveQuote = createAction({
  name: 'approveQuote',
  displayName: 'Approve Quote',
  description: 'Call to approve quote in zroArb',
  props: {},
  async run() {
    // Action logic here
    console.log('start approve quote action');
    return {
      success: true,
      message: 'Quote approved successfully',
    };
  },
});
