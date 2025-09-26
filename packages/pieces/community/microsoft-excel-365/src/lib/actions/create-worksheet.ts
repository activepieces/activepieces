import { createAction, Property } from '@activepieces/pieces-framework';

export const createWorksheet = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'createWorksheet',
  displayName: 'Create Worksheet',
  description: 'Add a new worksheet (tab) to an existing workbook with optional default headers.',
  props: {},
  async run() {
    // Action logic here
  },
});
