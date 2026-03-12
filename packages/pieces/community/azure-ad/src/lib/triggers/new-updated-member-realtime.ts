import { createTrigger, TriggerStrategy, WebhookRenewStrategy } from '@activepieces/pieces-framework';
import { azureAdAuth } from '../auth';
import { createGraphSubscription, deleteGraphSubscription, flattenNotificationItem } from '../common';

const CLIENT_STATE = 'activepieces_azure_ad_new_updated_member_realtime';
const STORE_KEY = '_subscription_new_updated_member_realtime';

export const newUpdatedMemberRealtimeTrigger = createTrigger({
    auth: azureAdAuth,
    name: 'new_updated_member_realtime',
    displayName: 'New/Updated Member (Real-time)',
    description: 'New or updated member in Microsoft Entra ID (fires when group membership changes)',
    type: TriggerStrategy.WEBHOOK,
    props: {},
    sampleData: {
        change_type: 'updated',
        resource: 'Groups/12345-xxxx',
        id: '12345-xxxx',
    },
    renewConfiguration: {
        strategy: WebhookRenewStrategy.CRON,
        cronExpression: '0 0 */1 * *',
    },
    async onEnable(context) {
        const token = (context.auth as { access_token: string }).access_token;
        const id = await createGraphSubscription(token, {
            resource: 'groups',
            changeType: 'updated',
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
    async onRenew(context) {
        const id = await context.store.get<string>(STORE_KEY);
        if (id) {
            const token = (context.auth as { access_token: string }).access_token;
            await deleteGraphSubscription(token, id);
        }
        const token = (context.auth as { access_token: string }).access_token;
        const newId = await createGraphSubscription(token, {
            resource: 'groups',
            changeType: 'updated',
            notificationUrl: context.webhookUrl!,
            clientState: CLIENT_STATE,
        });
        await context.store.put(STORE_KEY, newId);
    },
    async run(context) {
        const body = context.payload.body as { value?: Array<{ clientState?: string; changeType?: string; resource?: string; resourceData?: unknown }> };
        const list = body?.value ?? [];
        const valid = list.filter((n) => n.clientState === CLIENT_STATE);
        return valid.map((n) => flattenNotificationItem(n));
    },
});
