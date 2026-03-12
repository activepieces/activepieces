import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { azureAdAuth } from '../auth';
import { createGraphSubscription, deleteGraphSubscription } from '../common';

const CLIENT_STATE = 'activepieces_azure_ad_new_group';
const STORE_KEY = '_subscription_new_group';

export const newGroupTrigger = createTrigger({
    auth: azureAdAuth,
    name: 'new_group',
    displayName: 'New Group',
    description: 'New group in Microsoft Entra ID',
    type: TriggerStrategy.WEBHOOK,
    props: {},
    sampleData: {
        changeType: 'created',
        resource: 'Groups/12345-xxxx',
        resourceData: { id: '12345-xxxx', '@odata.type': '#Microsoft.Graph.Group' },
    },
    async onEnable(context) {
        const token = (context.auth as { access_token: string }).access_token;
        const id = await createGraphSubscription(token, {
            resource: 'groups',
            changeType: 'created',
            notificationUrl: context.webhookUrl!,
            clientState: CLIENT_STATE,
        });
        await context.store.put(STORE_KEY, id);
    },
    async onDisable(context) {
        const id = await context.store.get<string>(STORE_KEY);
        if (id) {
            const token = (context.auth as { access_token: string }).access_token;
            await deleteGraphSubscription(token, id);
        }
        await context.store.delete(STORE_KEY);
    },
    async run(context) {
        const body = context.payload.body as { value?: Array<{ clientState?: string; changeType?: string; resource?: string; resourceData?: unknown }> };
        const list = body?.value ?? [];
        const valid = list.filter((n) => n.clientState === CLIENT_STATE);
        return valid;
    },
});
