import { sessionAuth } from "@activepieces/piece-sessions-us";
import { createTrigger, TriggerStrategy } from "@activepieces/pieces-framework";
import { createWebhook, deleteWebhook, SessionsUsWebhookTriggers } from "../common";

export const takeawayReady = createTrigger({
    auth: sessionAuth,
    name: "takeaway_ready",
    displayName: "Takeaway Ready",
    description: "Triggered when a takeaway becomes available.",
    props: {},
    type: TriggerStrategy.WEBHOOK,
    sampleData: {
        test: ''
    },
    async onEnable({ auth, webhookUrl, store }) {
        const webhookId = await createWebhook(SessionsUsWebhookTriggers.TAKEAWAY_READY, auth, webhookUrl, 'personal');

        await store.put('sessions_takeaway_trigger', {
            webhookId: webhookId
        });
    },
    async onDisable({ auth, webhookUrl, store }) {
        const webhookId = await store.get('sessions_takeaway_trigger');
        if (webhookId) {
            await deleteWebhook(webhookId as string, auth)
        }
    },
    async run({ payload }) {
        return [payload.body];
    },
});