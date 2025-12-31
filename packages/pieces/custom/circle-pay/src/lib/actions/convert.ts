import { createAction, Property } from '@activepieces/pieces-framework';

export const convert = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'convert',
  displayName: 'Convert currency',
  description: 'Convert currency',
  props: {},
  async run() {
    console.log('convert action');
    // Action logic here
    return {
      success: true,
      message: 'Convert action',
    };
  },
});
