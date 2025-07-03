import { createAction, Property } from '@activepieces/pieces-framework';

export const findBoardByName = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'findBoardByName',
  displayName: 'Find Board by Name',
  description: '',
  props: {},
  async run() {
    // Action logic here
  },
});
