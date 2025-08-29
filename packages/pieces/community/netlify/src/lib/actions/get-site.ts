import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod } from "@activepieces/pieces-common";
import { netlifyAuth } from "../../index";
import { callNetlifyApi } from "../common";

export const getSite = createAction({
    name: 'get_site',
    auth: netlifyAuth,
    displayName: 'Get Site',
    description: 'Get a specified site.',
    props: {
        site_id: Property.Dropdown({
            displayName: 'Site',
            description: 'The Netlify site to retrieve.',
            required: true,
            refreshers: [],
            async options(propsValue) {
                const { auth } = propsValue;
                if (!auth) {
                    return {
                        disabled: true,
                        placeholder: 'Please connect your Netlify account first.',
                        options: [],
                    };
                }
                // Fetches sites from Netlify API to populate the dropdown
                const sites = await callNetlifyApi<any[]>(
                    HttpMethod.GET,
                    'sites',
                    auth as any,
                );
                return {
                    disabled: false,
                    options: sites.map((site: any) => ({
                        label: site.name,
                        value: site.id,
                    })),
                };
            },
        }),
    },
    async run(context) {
        const { auth } = context;
        const { site_id } = context.propsValue;

        // Makes the API call to the specific site endpoint
        return await callNetlifyApi(
            HttpMethod.GET,
            `sites/${site_id}`,
            auth
        );
    },
});