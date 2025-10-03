import { HttpMethod } from "@activepieces/pieces-common";
import { createTrigger } from "@activepieces/pieces-framework";
import { TriggerStrategy } from "@activepieces/shared";
import { SenderAuth } from "../common/auth";
import { makeRequest } from "../common/client";

export const newSubscriber = createTrigger({
    auth: SenderAuth,
    name: "newSubscriber",
    displayName: "New Subscriber",
    description: "Triggers when a new subscriber is added",
    props: {},

    sampleData: {},

    type: TriggerStrategy.WEBHOOK,

    async onEnable(context) {
        const body = {
            url: context.webhookUrl,
            topic: "subscribers/new",
        };

        const response = await makeRequest(
            context.auth as string,
            HttpMethod.POST,
            "/account/webhooks",
            body
        );

        await context.store?.put("webhookId", response.body.data.id);
    },

    async onDisable(context) {
        const webhookId = await context.store?.get("webhookId");
        if (webhookId) {
            await makeRequest(
                context.auth as string,
                HttpMethod.DELETE,
                `/account/webhooks/${webhookId}`
            );
        }
        await context.store?.delete("webhookId");
    },

    async run(context) {
        return [context.payload.body];
    },

    async test(context) {
        const response = await makeRequest(
            context.auth as string,
            HttpMethod.GET,
            "/subscribers?limit=1"
        );
        const subscribers = response?.data ?? response?.body?.data ?? [];
        return Array.isArray(subscribers) ? subscribers : [subscribers];
    },
});
