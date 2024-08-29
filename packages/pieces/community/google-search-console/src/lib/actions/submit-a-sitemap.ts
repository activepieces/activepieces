import { createAction, Property } from '@activepieces/pieces-framework';
import { googleSearchConsoleAuth, createAuthClient } from '../../';

export const submitSitemap = createAction({
    auth: googleSearchConsoleAuth,
    name: 'submit_sitemap',
    displayName: 'Submit a Sitemap',
    description: 'Submit a sitemap to Google',
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
        feedpath: Property.ShortText({
            displayName: 'Sitemap Path',
            required: true,
        }),
    },
    async run(context) {
        const webmasters = createAuthClient(context.auth.access_token);
        await webmasters.sitemaps.submit({
            siteUrl: context.propsValue.siteUrl,
            feedpath: context.propsValue.feedpath,
        });
        return { success: true };
    },
});
