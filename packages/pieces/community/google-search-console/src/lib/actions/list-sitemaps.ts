import { createAction, Property } from '@activepieces/pieces-framework';
import { googleSearchConsoleAuth, createAuthClient } from '../../';

export const listSitemaps = createAction({
    auth: googleSearchConsoleAuth,
    name: 'list_sitemaps',
    displayName: 'List Sitemaps',
    description: 'List all your sitemaps for a given site',
    props: {
        siteUrl: Property.Dropdown({
            displayName: 'Site URL',
            required: true,
            refreshers: ['auth'],
            refreshOnSearch: false,
            options: async ({ auth }) => {
                // @ts-ignore
                const webmasters = createAuthClient(auth.access_token);
                const res = await webmasters.sites.list();
                const sites = res.data.siteEntry || [];

                return {
                    options: sites.map((site: any) => ({
                        label: site.siteUrl,
                        value: site.siteUrl,
                    })),
                };
            },
        }),
    },
    async run(context) {
        const webmasters = createAuthClient(context.auth.access_token);
        const res = await webmasters.sitemaps.list({
            siteUrl: context.propsValue.siteUrl,
        });
        return res.data;
    },
});
