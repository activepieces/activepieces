import { createAction, Property } from '@activepieces/pieces-framework';
import { googleSearchConsoleAuth, createAuthClient } from '../../';
import axios from "axios";

export const urlInspection = createAction({
    auth: googleSearchConsoleAuth,
    name: 'urlInspection',
    displayName: 'URL Inspection',
    description: "Use the URL Inspection action to check the status and presence of a specific page within Google's index.",
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
                    options : sites.map((site: any) => ({
                        label: site.siteUrl,
                        value: site.siteUrl,
                    }))
                }
            },
        }),
        url: Property.ShortText({
            displayName: 'URL to Inspect',
            required: true,
        }),
    },
    async run(context) {
        const accessToken = context.auth.access_token;
        const apiUrl = 'https://searchconsole.googleapis.com/v1/urlInspection/index:inspect';

        const data = {
            inspectionUrl: context.propsValue.url,
            siteUrl: context.propsValue.siteUrl,
        };

        try {
            const response = await axios.post(apiUrl, data, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            });

            return response.data;
        } catch (error) {
            // @ts-ignore
            return { error: error.response?.data || error.message };
        }
    },
});
