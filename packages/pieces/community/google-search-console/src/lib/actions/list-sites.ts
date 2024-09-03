import { createAction } from '@activepieces/pieces-framework';
import { googleSearchConsoleAuth, createAuthClient } from '../../';

export const listSites = createAction({
    auth: googleSearchConsoleAuth,
    name: 'list_sites',
    displayName: 'List Sites',
    description: 'List all properties in your Google Search Console account',
    props: {},
    async run(context) {
        const webmasters = createAuthClient(context.auth.access_token);
        const res = await webmasters.sites.list();
        return res.data;
    },
});
