import { createAction, Property } from '@activepieces/pieces-framework';

export const updateRecord = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'updateRecord',
  displayName: 'Update Record',
  description: 'Update an existing record’s fields',
  props: {},
  async run() {
    // Action logic here
  },
});
