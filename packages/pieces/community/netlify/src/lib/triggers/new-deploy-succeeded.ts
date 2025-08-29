import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { netlifyAuth } from '../../index';
import { callNetlifyApi } from '../common';

interface Deploy {
    id: string;
    state: string; // We need the 'state' to check for success
    // Add other relevant properties from the deploy object if needed
}

export const newDeploySucceeded = createTrigger({
    name: 'new_deploy_succeeded',
    auth: netlifyAuth,
    displayName: 'New Deploy Succeeded',
    description: 'Fires when a new site version has successfully deployed.',
    props: {
        site_id: Property.Dropdown({
            displayName: 'Site',
            description: 'The Netlify site to monitor for successful deploys.',
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
                const sites = await callNetlifyApi<any[]>(HttpMethod.GET, 'sites', auth as any);
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
        "id": "603f7a4b1e5a5c0007a3b3c4",
        "site_id": "YOUR_SITE_ID",
        "build_id": "603f7a4b1e5a5c0007a3b3c5",
        "state": "ready", // Sample state is 'ready' for success
        "name": "your-site-name",
        "url": "https://603f7a4b1e5a5c0007a3b3c4--your-site-name.netlify.app",
        "published_at": "2025-08-29T12:30:33.222Z",
        "branch": "main",
    },

    async onEnable(context) {
        // Fetch recent deploys to find the last successful one
        const deploys = await callNetlifyApi<Deploy[]>(
            HttpMethod.GET,
            `sites/${context.propsValue.site_id}/deploys`,
            context.auth,
        );
        const lastSuccessfulDeploy = deploys.find(d => d.state === 'ready');
        await context.store.put('last_succeeded_deploy_id', lastSuccessfulDeploy?.id ?? null);
    },

    async onDisable(context) {
        await context.store.delete('last_succeeded_deploy_id');
    },

    async run(context) {
        const lastId = await context.store.get<string | null>('last_succeeded_deploy_id');
        const deploys = await callNetlifyApi<Deploy[]>(
            HttpMethod.GET,
            `sites/${context.propsValue.site_id}/deploys`,
            context.auth
        );
        
        const successfulDeploys = deploys.filter(d => d.state === 'ready');

        if (successfulDeploys.length === 0) {
            return [];
        }

        // Store the ID of the newest successful deploy for the next run
        await context.store.put('last_succeeded_deploy_id', successfulDeploys[0].id);

        const newSuccessfulDeploys = [];
        for (const deploy of successfulDeploys) {
            if (deploy.id === lastId) {
                break; 
            }
            newSuccessfulDeploys.push(deploy);
        }

        return newSuccessfulDeploys.reverse();
    },
});