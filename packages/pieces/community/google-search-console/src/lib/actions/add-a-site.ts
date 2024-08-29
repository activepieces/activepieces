import { createAction, Property } from '@activepieces/pieces-framework';
import { googleSearchConsoleAuth, createAuthClient } from '../../';

export const addSite = createAction({
    auth: googleSearchConsoleAuth,
    name: 'add_site',
    displayName: 'Add a Site',
    description: 'Add a property to your Google Search Console account',
    props: {
        siteUrl: Property.ShortText({
            displayName: 'Site URL',
            required: true,
        }),
    },
    async run(context) {
        const webmasters = createAuthClient(context.auth.access_token);
        await webmasters.sites.add({
            siteUrl: context.propsValue.siteUrl,
        });
        return { success: true };
    },
});
