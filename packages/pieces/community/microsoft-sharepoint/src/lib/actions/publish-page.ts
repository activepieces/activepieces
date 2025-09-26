import { createAction, Property } from '@activepieces/pieces-framework';

export const publishPage = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'publishPage',
  displayName: 'Publish Page',
  description: 'Change a SharePoint page status to “Published.”',
  props: {},
  async run() {
    // Action logic here
  },
});
