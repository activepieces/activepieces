
import { createTrigger, TriggerStrategy, PiecePropValueSchema, Property } from "@activepieces/pieces-framework";
import { DedupeStrategy, HttpMethod, Polling, pollingHelper } from "@activepieces/pieces-common";
import { frontAuth } from "../common/auth";
import { makeRequest } from "../common/client";

// replace auth with piece auth variable
const polling: Polling<PiecePropValueSchema<typeof frontAuth>, { conversationId: string }> = {
    strategy: DedupeStrategy.TIMEBASED,
    items: async ({ auth, propsValue, lastFetchEpochMS }) => {
        const allComments: { epochMilliSeconds: number; data: unknown }[] = [];

        // Max limit are 15
        const events = await makeRequest<{ _results: { created_at: string }[] }>(
            auth as string,
            HttpMethod.GET,
            `/events?q[types]=comment&q[conversations]=${encodeURIComponent(propsValue.conversationId)}&limit=15`
        );
        for (const event of events._results || []) {
            const createdAtMs = Math.floor(Number(event.created_at) * 1000);
            if (!lastFetchEpochMS || createdAtMs > lastFetchEpochMS) {
                allComments.push({
                    epochMilliSeconds: createdAtMs,
                    data: event,
                });
            }
        }

        return allComments;
    }
}

export const newComment = createTrigger({
    auth: frontAuth,
    name: "newComment",
    displayName: "New Comment",
    description: "Fires when a new comment is posted on a conversation in Front.",
    props: {
        conversationId: Property.ShortText({
            displayName: "Conversation ID",
            description: "ID of the conversation.",
            required: true,
        }),
    },
    sampleData: {
        "_links": {
            "self": "https://yourCompany.api.frontapp.com/comments/com_1ywg3f2",
            "related": {
                "conversation": "https://yourCompany.api.frontapp.com/conversations/cnv_y4xb93i",
                "mentions": "https://yourCompany.api.frontapp.com/comments/com_1ywg3f2/mentions"
            }
        },
        "id": "com_1ywg3f2",
        "author": {
            "_links": {
                "self": "https://yourCompany.api.frontapp.com/teammates/tea_6r55a",
                "related": {
                    "inboxes": "https://yourCompany.api.frontapp.com/teammates/tea_6r55a/inboxes",
                    "conversations": "https://yourCompany.api.frontapp.com/teammates/tea_6r55a/conversations",
                    "botSource": "https://yourCompany.api.frontapp.com/rules/rul_6r55a"
                }
            },
            "id": "tea_6r55a",
            "email": "michael.scott@dundermifflin.com",
            "username": "PrisonMike",
            "first_name": "Michael",
            "last_name": "Scott",
            "is_admin": true,
            "is_available": false,
            "is_blocked": false,
            "type": "user",
            "custom_fields": {
                "city": "London, UK",
                "isVIP": true,
                "renewal_date": 1525417200,
                "sla_time": 90,
                "owner": "leela@planet-express.com",
                "replyTo": "inb_55c8c149",
                "Job Title": "firefighter"
            }
        },
        "body": "Sometimes I'll start a sentence and I don't even know where it's going. I just hope I find it along the way.",
        "posted_at": 1698943401.378,
        "attachments": [
            {
                "id": "fil_3q8a7mby",
                "filename": "Andy_Anger_Management_Certificate.png",
                "url": "https://yourCompany.api.frontapp.com/download/fil_3q8a7mby",
                "content_type": "image/png",
                "size": 4405,
                "metadata": {
                    "is_inline": true,
                    "cid": "526b45586d0e6b1c484afab63d1ef0be"
                }
            }
        ],
        "is_pinned": true
    },
    type: TriggerStrategy.POLLING,
    async test(context) {
        return await pollingHelper.test(polling, context);
    },
    async onEnable(context) {
        const { store, auth, propsValue } = context;
        await pollingHelper.onEnable(polling, { store, auth: auth as string, propsValue });
    },
    async onDisable(context) {
        const { store, auth, propsValue } = context;
        await pollingHelper.onDisable(polling, { store, auth: auth as string, propsValue });
    },
    async run(context) {
        return await pollingHelper.poll(polling, context);
    },
});
