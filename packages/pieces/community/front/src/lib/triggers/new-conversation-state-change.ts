import { createTrigger, TriggerStrategy, PiecePropValueSchema, Property } from "@activepieces/pieces-framework";
import { DedupeStrategy, HttpMethod, Polling, pollingHelper } from "@activepieces/pieces-common";
import { frontAuth } from "../common/auth";
import { makeRequest } from "../common/client";

const polling: Polling<PiecePropValueSchema<typeof frontAuth>, { conversationId: string; state: string | undefined }> = {
    strategy: DedupeStrategy.TIMEBASED,
    items: async ({ auth, propsValue, lastFetchEpochMS }) => {
        const conversation = await makeRequest<{ status: string; updated_at: string }>(
            auth as string,
            HttpMethod.GET,
            `/conversations/${propsValue.conversationId}`
        );

        const changedAt: number | null = conversation.updated_at
            ? Math.floor(Number(conversation.updated_at) * 1000)
            : null;

        if (
            (propsValue.state && conversation.status === propsValue.state) &&
            changedAt !== null &&
            (!lastFetchEpochMS || changedAt > lastFetchEpochMS)
        ) {
            return [{
                epochMilliSeconds: changedAt,
                data: conversation,
            }];
        }

        return [];
    },
};

export const newConversationStateChange = createTrigger({
    auth: frontAuth,
    name: "newConversationStateChange",
    displayName: "New Conversation State Change",
    description: "Fires when a conversation state changes in Front.",
    props: {
        conversationId: Property.ShortText({
            displayName: "Conversation ID",
            description: "The ID of the conversation to monitor.",
            required: true,
        }),
        state: Property.StaticDropdown({
            displayName: "State",
            description: "The state to trigger on.",
            required: false,
            options: {
                options: [
                    { label: "Open", value: "open" },
                    { label: "Archived", value: "archived" },
                    { label: "Deleted", value: "deleted" },
                    { label: "Assigned", value: "assigned" },
                    { label: "Unassigned", value: "unassigned" },
                ],
            },
        }),
    },
    sampleData: {
        "_links": {
            "self": "https://yourCompany.api.frontapp.com/conversations/cnv_yo1kg5q",
            "related": {
                "events": "https://yourCompany.api.frontapp.com/conversations/cnv_yo1kg5q/events",
                "followers": "https://yourCompany.api.frontapp.com/conversations/cnv_yo1kg5q/followers",
                "messages": "https://yourCompany.api.frontapp.com/conversations/cnv_yo1kg5q/messages",
                "comments": "https://yourCompany.api.frontapp.com/conversations/cnv_yo1kg5q/comments",
                "inboxes": "https://yourCompany.api.frontapp.com/conversations/cnv_yo1kg5q/inboxes",
                "last_message": "https://yourCompany.api.frontapp.com/messages/msg_1q15qmtq?referer=conversation"
            }
        },
        "id": "cnv_yo1kg5q",
        "subject": "How to prank Dwight Schrute",
        "status": "assigned",
        "status_id": "sts_5x",
        "status_category": "resolved",
        "ticket_ids": [
            "TICKET-1"
        ],
        "assignee": {
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
        "recipient": {
            "_links": {
                "related": {
                    "contact": "https://yourCompany.api.frontapp.com/contacts/crd_2njtoem"
                }
            },
            "name": "Phyllis Lapin-Vance",
            "handle": "purpleboss@limitlesspaper.com",
            "role": "cc"
        },
        "tags": [
            {
                "_links": {
                    "self": "https://yourCompany.api.frontapp.com/tags/tag_2oxhvy",
                    "related": {
                        "conversations": "https://yourCompany.api.frontapp.com/tags/tag_2oxhvy/conversations",
                        "owner": "https://yourCompany.api.frontapp.com/teammates/tea_6jydq",
                        "parent_tag": "https://yourCompany.api.frontapp.com/tags/tag_3h07ym",
                        "children": "https://yourCompany.api.frontapp.com/tags/tag_2oxhvy/children"
                    }
                },
                "id": "tag_2oxhvy",
                "name": "Warehouse task",
                "description": "Sitting on your biscuit, never having to risk it",
                "highlight": null,
                "is_private": false,
                "is_visible_in_conversation_lists": true,
                "created_at": 1682538996.583,
                "updated_at": 1699575875.186
            }
        ],
        "links": [
            {
                "_links": {
                    "self": "https://yourCompany.api.frontapp.com/links/top_b2wpa"
                },
                "id": "top_b2wpa",
                "name": "JIRA-SCRAN-4567",
                "type": "app_2f76b9ac738de158",
                "external_url": "https://dundermifflin.atlassian.net/browse/PB-SCRAN-4567",
                "custom_fields": {
                    "city": "London, UK",
                    "isVIP": true,
                    "renewal_date": 1525417200,
                    "sla_time": 90,
                    "owner": "leela@planet-express.com",
                    "replyTo": "inb_55c8c149",
                    "Job Title": "firefighter"
                }
            }
        ],
        "custom_fields": {
            "city": "London, UK",
            "isVIP": true,
            "renewal_date": 1525417200,
            "sla_time": 90,
            "owner": "leela@planet-express.com",
            "replyTo": "inb_55c8c149",
            "Job Title": "firefighter"
        },
        "created_at": 1701292649.333,
        "waiting_since": 1701292649.333,
        "is_private": true,
        "scheduled_reminders": [
            {
                "_links": {
                    "related": {
                        "owner": "https://yourCompany.api.frontapp.com/teammates/tea_6r55a"
                    }
                },
                "created_at": 1701806790.536,
                "scheduled_at": 1701874800,
                "updated_at": 1701806790.536
            }
        ],
        "metadata": {
            "external_conversation_ids": [
                "JS3949",
                "JS9403"
            ]
        }
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
