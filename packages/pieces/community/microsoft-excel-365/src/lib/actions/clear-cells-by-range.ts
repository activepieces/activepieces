import { createAction, Property } from '@activepieces/pieces-framework';

export const clearCellsByRange	 = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'clearCellsByRange	',
  displayName: 'Clear Cells by Range	',
  description: 'Clear a block of cells (range) content or formatting.',
  props: {},
  async run() {
    // Action logic here
  },
});
