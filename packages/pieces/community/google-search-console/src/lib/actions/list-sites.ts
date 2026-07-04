import { createAction } from '@activepieces/pieces-framework';
import { googleSearchConsoleAuth } from '../auth';
import { createAuthClient } from '../../';

export const listSites = createAction({
  auth: googleSearchConsoleAuth,
  name: 'list_sites',
  displayName: 'List Sites',
  description: "Lists the user's Search Console sites.",
  audience: 'both',
  aiMetadata: { description: "List all sites the authenticated user has access to in Google Search Console, with each site's permission level. Choose this to discover available siteUrl values before calling other actions, or to verify access. Takes no input; read-only and idempotent.", idempotent: true },
  props: {},
  async run(context) {
    const webmasters = createAuthClient(context.auth.access_token);
    const res = await webmasters.sites.list();
    return res.data;
  },
});
