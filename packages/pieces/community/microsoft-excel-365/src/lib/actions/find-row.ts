import { createAction, Property } from '@activepieces/pieces-framework';

export const findRow = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'findRow',
  displayName: 'Find Row',
  description: 'Locate a row by specifying a lookup column and value (e.g. find a row where “ID” = 123).',
  props: {},
  async run() {
    // Action logic here
  },
});
