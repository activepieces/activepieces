    import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod } from "@activepieces/pieces-common";
import { netlifyAuth } from "../../index";
import { callNetlifyApi } from "../common";

export const startDeploy = createAction({
    name: 'start_deploy',
    auth: netlifyAuth,
    displayName: 'Start Deploy',
    description: 'Triggers a new build for a site on Netlify.',
    props: {
        site_id: Property.Dropdown({
            displayName: 'Site',
            description: 'The Netlify site to deploy.',
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
        clear_cache: Property.Checkbox({
            displayName: 'Clear Build Cache',
            description: 'If true, clears the build cache before starting the build.',
            required: false,
            defaultValue: false,
        }),
    },
    async run(context) {
        const { auth } = context;
        const { site_id, clear_cache } = context.propsValue;

        const body = {
            clear_cache: clear_cache ?? false,
        };

        // Triggers a new build for the selected site
        return await callNetlifyApi(
            HttpMethod.POST,
            `sites/${site_id}/builds`,
            auth,
            body
        );
    },
});