import { createAction } from '@activepieces/pieces-framework';
import { googleSearchConsoleAuth, createAuthClient } from '../../';

export const listSites = createAction({
  auth: googleSearchConsoleAuth,
  name: 'list_sites',
  displayName: 'List Sites',
  description: "Lists the user's Search Console sites.",
  props: {},
  async run(context) {
    const webmasters = createAuthClient(context.auth.access_token);
    const res = await webmasters.sites.list();
    return res.data;
  },
});
