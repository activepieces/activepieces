import { createAction, Property } from '@activepieces/pieces-framework';

export const getCellsInRange = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'getCellsInRange',
  displayName: 'Get Cells in Range',
  description: 'Retrieve the values in a given cell range (e.g., “A1:C10”).',
  props: {},
  async run() {
    // Action logic here
  },
});
