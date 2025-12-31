import { createAction } from '@activepieces/pieces-framework';

export const updateOrder = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'updateOrder',
  displayName: 'Update Order',
  description: 'Request to update order',
  props: {},
  async run() {
    console.log('update order action');
    return {
      success: true,
      message: 'Update order action',
    };
  },
});
