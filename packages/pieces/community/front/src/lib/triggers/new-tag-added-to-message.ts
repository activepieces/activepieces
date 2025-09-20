import { createTrigger, TriggerStrategy, PiecePropValueSchema, Property } from "@activepieces/pieces-framework";
import { DedupeStrategy, HttpMethod, Polling, pollingHelper } from "@activepieces/pieces-common";
import { frontAuth } from "../common/auth";
import { makeRequest } from "../common/client";

const polling: Polling<PiecePropValueSchema<typeof frontAuth>, { inboxId?: string }> = {
    strategy: DedupeStrategy.TIMEBASED,
    items: async ({ auth, propsValue, lastFetchEpochMS }) => {
        const outboundMessages: { epochMilliSeconds: number; data: unknown }[] = [];

        // Max limit are 15
        const events = await makeRequest<{ _results: { created_at: string }[] }>(
            auth as string,
            HttpMethod.GET,
            `/events?q[types]=tag&limit=15` + (propsValue.inboxId ? `&q[inboxes]=${encodeURIComponent(propsValue.inboxId)}` : "")
        );

        for (const event of events._results) {
            // Only include new events since last fetch
            const createdAtMs = Math.floor(Number(event.created_at) * 1000);
            if (!lastFetchEpochMS || createdAtMs > lastFetchEpochMS) {
                outboundMessages.push({
                    epochMilliSeconds: createdAtMs,
                    data: event,
                });
            }
        }

        return outboundMessages;
    },
};

export const newTagAddedToMessage = createTrigger({
    auth: frontAuth,
    name: "newTagAddedToMessage",
    displayName: "New Tag Added To Message",
    description: "Fires when a tag is added to a message in Front.",
    props: {
        inboxId: Property.ShortText({
            displayName: "Inbox ID",
            description: "Inbox to filter events to.",
            required: false,
        }),
    },
    sampleData: {
        id: "evt_123",
        type: "tag_added",
        tag: {
            id: "tag_abc",
            name: "VIP",
        },
        conversation_id: "cnv_645",
        message_id: "msg_456",
        created_at: 1701606990.123,
    },
    type: TriggerStrategy.POLLING,
    async test(context) {
        return await pollingHelper.test(polling, context);
    },
    async onEnable(context) {
        const { store, auth, propsValue } = context;
        await pollingHelper.onEnable(polling, { store, auth, propsValue });
    },
    async onDisable(context) {
        const { store, auth, propsValue } = context;
        await pollingHelper.onDisable(polling, { store, auth, propsValue });
    },
    async run(context) {
        return await pollingHelper.poll(polling, context);
    },
});
