import { createAction, Property } from '@activepieces/pieces-framework';

export const deleteRecord = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'deleteRecord',
  displayName: 'Delete Record',
  description: '	Deletes record',
  props: {},
  async run() {
    // Action logic here
  },
});
