import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { netlifyAuth } from '../../index';
import { callNetlifyApi } from '../common';

interface Deploy {
    id: string;
    site_id: string;
    // Add other relevant properties from the deploy object if needed
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
        "state": "ready",
        "name": "your-site-name",
        "url": "https://603f7a4b1e5a5c0007a3b3c4--your-site-name.netlify.app",
        "ssl_url": "https://603f7a4b1e5a5c0007a3b3c4--your-site-name.netlify.app",
        "admin_url": "https://app.netlify.com/sites/your-site-name/deploys/603f7a4b1e5a5c0007a3b3c4",
        "deploy_url": "https://your-site-name.netlify.app",
        "deploy_ssl_url": "https://your-site-name.netlify.app",
        "created_at": "2025-02-28T10:30:03.111Z",
        "updated_at": "2025-02-28T10:30:33.222Z",
        "published_at": "2025-02-28T10:30:33.222Z",
        "branch": "main",
        "commit_ref": "a1b2c3d4e5f6",
    },

    async onEnable(context) {
        // Fetch the most recent deploy to set an initial state
        const deploys = await callNetlifyApi<Deploy[]>(
            HttpMethod.GET,
            `sites/${context.propsValue.site_id}/deploys`,
            context.auth,
            undefined,
            { per_page: "1" }
        );
        const lastId = deploys.length > 0 ? deploys[0].id : null;
        await context.store.put('last_deploy_id', lastId);
    },

    async onDisable(context) {
        // Clean up the store when the trigger is disabled
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

        // Store the ID of the newest deploy for the next run
        await context.store.put('last_deploy_id', deploys[0].id);

        const newDeploys = [];
        for (const deploy of deploys) {
            if (deploy.id === lastId) {
                break; // Stop when we reach the last processed deploy
            }
            newDeploys.push(deploy);
        }

        // Return new deploys in chronological order (oldest first)
        return newDeploys.reverse();
    },
});