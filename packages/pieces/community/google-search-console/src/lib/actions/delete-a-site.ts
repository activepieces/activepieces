import { createAction, Property } from '@activepieces/pieces-framework';
import { googleSearchConsoleAuth, createAuthClient } from '../../';

export const deleteSite = createAction({
    auth: googleSearchConsoleAuth,
    name: 'delete_site',
    displayName: 'Delete a Site',
    description: 'Delete a property from your Google Search Console account',
    props: {
        siteUrlParam: Property.ShortText({
            displayName: 'Site URL',
            description: 'Enter the URL of the site to delete',
            required: false,
        }),
        siteUrl: Property.Dropdown({
            displayName: 'Site URL List',
            description: 'Select a site from your Google Search Console account',
            required: false,
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
        // Prioritize the siteUrlParam if it's provided, otherwise use the siteUrl from the dropdown
        const siteUrl = context.propsValue.siteUrlParam || context.propsValue.siteUrl;

        if (!siteUrl) {
            throw new Error("You must provide either a Site URL or select one from the list.");
        }

        const webmasters = createAuthClient(context.auth.access_token);
        await webmasters.sites.delete({
            siteUrl: siteUrl,
        });

        return { success: true };
    },
});
