import { createAction } from '@activepieces/pieces-framework';

export const transferFiat = createAction({
  name: 'transferFiat',
  displayName: 'Transfer fiat',
  description: 'Transfer amount fiat currency',
  props: {},
  async run() {
    console.log('transfer fiat action');
    // Action logic here
    return {
      success: true,
      message: 'Transfer fiat action',
    };
  },
});
