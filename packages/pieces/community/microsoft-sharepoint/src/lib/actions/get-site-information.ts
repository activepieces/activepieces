import { createAction, Property } from '@activepieces/pieces-framework';

export const getSiteInformation = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'getSiteInformation',
  displayName: 'Get Site Information',
  description: 'Fetch metadata of a SharePoint site (site ID, title, URL, description, etc.).',
  props: {},
  async run() {
    // Action logic here
  },
});
