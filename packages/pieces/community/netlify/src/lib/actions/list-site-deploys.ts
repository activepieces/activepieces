import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod, QueryParams } from "@activepieces/pieces-common";
import { netlifyAuth } from "../../index";
import { callNetlifyApi } from "../common";

export const listSiteDeploys = createAction({
    name: 'list_site_deploys',
    auth: netlifyAuth,
    displayName: 'List Site Deploys',
    description: 'Returns a list of all deploys for a specific site.',
    props: {
        site_id: Property.Dropdown({
            displayName: 'Site',
            description: 'The Netlify site to retrieve deploys from.',
            required: true,
            refreshers: ["auth"],
            async options({ auth }) {
                if (!auth) {
                    return {
                        disabled: true,
                        placeholder: 'Please connect your Netlify account first.',
                        options: [],
                    };
                }
                const sites = await callNetlifyApi<any[]>(
                    HttpMethod.GET,
                    'sites',
                    auth as string,
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
        page: Property.Number({
            displayName: 'Page',
            description: 'The page number to retrieve for pagination.',
            required: false,
        }),
        per_page: Property.Number({
            displayName: 'Deploys Per Page',
            description: 'The number of deploys to return per page (max: 100).',
            required: false,
        })
    },
    async run(context) {
        const { auth } = context;
        const { site_id, page, per_page } = context.propsValue;

        const queryParams: QueryParams = {};
        if (page) queryParams['page'] = page.toString();
        if (per_page) queryParams['per_page'] = per_page.toString();

        return await callNetlifyApi(
            HttpMethod.GET,
            `sites/${site_id}/deploys`,
            auth,
            undefined, 
            queryParams
        );
    },
});
