import {
    createTrigger,
    TriggerStrategy,
    Property,
} from "@activepieces/pieces-framework";
import { HttpMethod } from "@activepieces/pieces-common";
import { InsightoAuth } from "../common/auth";
import { makeRequest } from "../common/client";
import { AssistantDropdown } from "../common/dropdown";

export const newConversation = createTrigger({
    auth: InsightoAuth,
    name: "newConversation",
    displayName: "New Conversation",
    description:
        "Triggers when a new conversation is created in Insighto.ai (requires Assistant ID).",
    type: TriggerStrategy.WEBHOOK,
    props: {
        assistantId: AssistantDropdown,
    },
    sampleData: {
        id: "conv_123456",
        assistant_id: "asst_98765",
        created_at: "2025-09-15T12:00:00Z",
        user: {
            id: "user_54321",
            name: "Alice",
        },
        messages: [
            {
                id: "msg_111",
                role: "user",
                content: "Hi, I need help with my order.",
            },
        ],
    },

    async onEnable(context) {
        // Create webhook for new conversation events
        const body: Record<string, unknown> = {
            name: "Activepieces - New Conversation",
            endpoint: context.webhookUrl,
            enabled: true,
            assistant_id: context.propsValue.assistantId,
            event: "conversation.created",
        };

        const webhook = await makeRequest(
            context.auth,
            HttpMethod.POST,
            "/outbound_webhook",
            body
        );

        await context.store.put("webhookId", webhook.id);
    },

    async onDisable(context) {
        // Cleanup webhook
        const webhookId = await context.store.get("webhookId");
        if (webhookId) {
            await makeRequest(
                context.auth,
                HttpMethod.DELETE,
                `/outbound_webhook/${webhookId}`
            );
        }
    },

    async run(context) {
        return [context.payload.body];
    },
});
