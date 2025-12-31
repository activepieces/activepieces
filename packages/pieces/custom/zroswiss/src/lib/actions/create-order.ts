import { createAction } from '@activepieces/pieces-framework';

export const createOrder = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'createOrder',
  displayName: 'Create Order',
  description: 'Request to create order',
  props: {},
  async run() {
    console.log('create order action');
    return {
      success: true,
      message: 'Create order action',
    };
  },
});
