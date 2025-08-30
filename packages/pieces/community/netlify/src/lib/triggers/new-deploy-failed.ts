import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { netlifyAuth } from '../../index';
import { callNetlifyApi } from '../common';

interface Deploy {
    id: string;
    state: string; 
    error_message?: string;
}

export const newDeployFailed = createTrigger({
    name: 'new_deploy_failed',
    auth: netlifyAuth,
    displayName: 'New Deploy Failed',
    description: 'Fires when a site deploy fails.',
    props: {
        site_id: Property.Dropdown({
            displayName: 'Site',
            description: 'The Netlify site to monitor for failed deploys.',
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
        "id": "603f7a4b1e5a5c0007a3b3c6",
        "site_id": "YOUR_SITE_ID",
        "build_id": "603f7a4b1e5a5c0007a3b3c7",
        "state": "error", // Sample state is 'error' for failure
        "name": "your-site-name",
        "error_message": "Build script returned non-zero exit code: 1",
        "created_at": "2025-08-29T12:50:00.111Z",
        "branch": "main",
    },

    async onEnable(context) {
        
        const deploys = await callNetlifyApi<Deploy[]>(
            HttpMethod.GET,
            `sites/${context.propsValue.site_id}/deploys`,
            context.auth,
        );
        const lastFailedDeploy = deploys.find(d => d.state === 'error');
        await context.store.put('last_failed_deploy_id', lastFailedDeploy?.id ?? null);
    },

    async onDisable(context) {
        await context.store.delete('last_failed_deploy_id');
    },

    async run(context) {
        const lastId = await context.store.get<string | null>('last_failed_deploy_id');
        const deploys = await callNetlifyApi<Deploy[]>(
            HttpMethod.GET,
            `sites/${context.propsValue.site_id}/deploys`,
            context.auth
        );
        
        const failedDeploys = deploys.filter(d => d.state === 'error');

        if (failedDeploys.length === 0) {
            return [];
        }

        
        await context.store.put('last_failed_deploy_id', failedDeploys[0].id);

        const newFailedDeploys = [];
        for (const deploy of failedDeploys) {
            if (deploy.id === lastId) {
                break; 
            }
            newFailedDeploys.push(deploy);
        }

        return newFailedDeploys.reverse();
    },
});