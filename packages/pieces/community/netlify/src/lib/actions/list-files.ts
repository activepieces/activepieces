import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod } from "@activepieces/pieces-common";
import { netlifyAuth } from "../../index";
import { callNetlifyApi } from "../common";

export const listFiles = createAction({
    name: 'list_files',
    auth: netlifyAuth,
    displayName: 'List Files',
    description: 'Returns a list of all the files in the current deploy.',
    props: {
        site_id: Property.Dropdown({
            displayName: 'Site',
            description: 'The Netlify site to list files from.',
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

        
        return await callNetlifyApi(
            HttpMethod.GET,
            `sites/${site_id}/files`,
            auth
        );
    },
});