import { createAction } from '@activepieces/pieces-framework';

export const getOrder = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'getOrder',
  displayName: 'Get Order',
  description: 'Get Order',
  props: {},
  async run() { 
    console.log('get order action');
    // Action logic here
    return {
      success: true,
      message: 'Order fetched successfully',
    };
  },
});
