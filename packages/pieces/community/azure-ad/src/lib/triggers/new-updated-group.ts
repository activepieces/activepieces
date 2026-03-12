import { randomBytes } from 'crypto';
import { createTrigger, TriggerStrategy, WebhookRenewStrategy } from '@activepieces/pieces-framework';
import { azureAdAuth } from '../auth';
import { createGraphSubscription, deleteGraphSubscription, flattenNotificationItem } from '../common';

const STORE_KEY = '_subscription_new_updated_group';

type SubscriptionStore = { id: string; clientState: string };

export const newUpdatedGroupTrigger = createTrigger({
    auth: azureAdAuth,
    name: 'new_updated_group',
    displayName: 'New/Updated Group',
    description: 'New or updated group in Microsoft Entra ID',
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
        const clientState = randomBytes(32).toString('hex');
        const id = await createGraphSubscription(token, {
            resource: 'groups',
            changeType: 'created,updated',
            notificationUrl: context.webhookUrl!,
            clientState,
        });
        await context.store.put(STORE_KEY, { id, clientState } satisfies SubscriptionStore);
    },
    async onDisable(context) {
        const data = await context.store.get<SubscriptionStore>(STORE_KEY);
        if (data?.id) {
            const token = (context.auth as { access_token: string }).access_token;
            await deleteGraphSubscription(token, data.id);
        }
        await context.store.delete(STORE_KEY);
    },
    async onRenew(context) {
        const data = await context.store.get<SubscriptionStore>(STORE_KEY);
        if (!data?.clientState) return;
        const token = (context.auth as { access_token: string }).access_token;
        if (data.id) await deleteGraphSubscription(token, data.id);
        const newId = await createGraphSubscription(token, {
            resource: 'groups',
            changeType: 'created,updated',
            notificationUrl: context.webhookUrl!,
            clientState: data.clientState,
        });
        await context.store.put(STORE_KEY, { id: newId, clientState: data.clientState } satisfies SubscriptionStore);
    },
    async run(context) {
        const data = await context.store.get<SubscriptionStore>(STORE_KEY);
        if (!data?.clientState) return [];
        const body = context.payload.body as { value?: Array<{ clientState?: string; changeType?: string; resource?: string; resourceData?: unknown }> };
        const list = body?.value ?? [];
        const valid = list.filter((n) => n.clientState === data.clientState);
        return valid.map((n) => flattenNotificationItem(n));
    },
});
