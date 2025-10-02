import { HttpMethod } from "@activepieces/pieces-common";
import { createTrigger, Property } from "@activepieces/pieces-framework";
import { TriggerStrategy } from "@activepieces/shared";
import { SenderAuth } from "../common/auth";
import { makeRequest } from "../common/client";
import { groupDropdown } from "../common/dropdown";

export const newSubscriberInGroup = createTrigger({
    auth: SenderAuth,
    name: "newSubscriberInGroup",
    displayName: "New Subscriber in Group",
    description: "Triggers when a new subscriber is added to a specific group",
    props: {
        groupId: groupDropdown,
    },

    sampleData: {},

    type: TriggerStrategy.WEBHOOK,

    async onEnable(context) {
        const body = {
            url: context.webhookUrl,
            events: ["subscriber.added_to_group"],
            group_id: context.propsValue.groupId,
        };

        const response = await makeRequest(
            context.auth as string,
            HttpMethod.POST,
            "/webhooks",
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
                `/webhooks/${webhookId}`
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
            `/subscribers?limit=1`
        );
        const subscribers = response?.data ?? response?.body?.data ?? [];
        return Array.isArray(subscribers) ? subscribers : [subscribers];
    },
});
