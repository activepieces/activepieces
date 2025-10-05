import { createAction, Property } from '@activepieces/pieces-framework';

export const deleteAClient = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'deleteAClient',
  displayName: 'Delete a Client',
  description: 'Delete an existing client.',
  props: {},
  async run() {
    // Action logic here
  },
});
