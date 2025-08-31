import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { netlifyAuth } from '../../index';
import { callNetlifyApi } from '../common';


interface Deploy {
    id: string;
    created_at: string;
}

export const newDeployStarted = createTrigger({
    name: 'new_deploy_started',
    auth: netlifyAuth,
    displayName: 'New Deploy Started',
    description: 'Fires immediately when a deploy job starts on your Netlify site.',
    props: {
        site_id: Property.Dropdown({
            displayName: 'Site',
            description: 'The Netlify site to monitor for new deploys.',
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
                const sites = await callNetlifyApi<any[]>(HttpMethod.GET, 'sites', auth as string);
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
    type: TriggerStrategy.POLLING,
    sampleData: {
        "id": "603f7a4b1e5a5c0007a3b3c6",
        "site_id": "YOUR_SITE_ID",
        "build_id": "603f7a4b1e5a5c0007a3b3c7",
        "state": "building", 
        "name": "your-site-name",
        "created_at": "2025-08-29T12:50:00.111Z",
        "branch": "main",
    },

    
    async onEnable(context) {
        
        const deploys = await callNetlifyApi<Deploy[]>(
            HttpMethod.GET,
            `sites/${context.propsValue.site_id}/deploys`,
            context.auth,
        );

        
        const lastDeployId = deploys.length > 0 ? deploys[0].id : null;
        await context.store.put('last_deploy_id', lastDeployId);
    },

    
    async onDisable(context) {
        
        await context.store.delete('last_deploy_id');
    },

    
    async run(context) {
        const lastId = await context.store.get<string | null>('last_deploy_id');
        const deploys = await callNetlifyApi<Deploy[]>(
            HttpMethod.GET,
            `sites/${context.propsValue.site_id}/deploys`,
            context.auth
        );

        if (deploys.length === 0) {
            return []; 
        }

        
        await context.store.put('last_deploy_id', deploys[0].id);

        const newDeploys = [];
        
        for (const deploy of deploys) {
            if (deploy.id === lastId) {
                break; 
            }
            newDeploys.push(deploy);
        }

        
        return newDeploys.reverse();
    },
});
