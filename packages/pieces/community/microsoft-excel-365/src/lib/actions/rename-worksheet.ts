import { createAction, Property } from '@activepieces/pieces-framework';

export const renameWorksheet = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'renameWorksheet',
  displayName: 'Rename Worksheet',
  description: 'Change the name of an existing worksheet.',
  props: {},
  async run() {
    // Action logic here
  },
});
