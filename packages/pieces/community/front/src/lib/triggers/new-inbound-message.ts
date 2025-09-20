import { createTrigger, TriggerStrategy, PiecePropValueSchema } from "@activepieces/pieces-framework";
import { DedupeStrategy, HttpMethod, Polling, pollingHelper } from "@activepieces/pieces-common";
import { frontAuth } from "../common/auth";
import { makeRequest } from "../common/client";

const polling: Polling<PiecePropValueSchema<typeof frontAuth>, Record<string, never>> = {
    strategy: DedupeStrategy.TIMEBASED,
    items: async ({ auth, lastFetchEpochMS }) => {
        const inboundMessages: { epochMilliSeconds: number; data: unknown }[] = [];

        // Max limit are 15
        const events = await makeRequest<{ _results: { created_at: string }[] }>(
            auth as string,
            HttpMethod.GET,
            "/events?q[types]=inbound&limit=15"
        );

        for (const event of events._results) {
            // Only include new events since last fetch
            const createdAtMs = Math.floor(Number(event.created_at) * 1000);
            if (!lastFetchEpochMS || createdAtMs > lastFetchEpochMS) {
                inboundMessages.push({
                    epochMilliSeconds: createdAtMs,
                    data: event,
                });
            }
        }

        return inboundMessages;
    },
};

export const newInboundMessage = createTrigger({
    auth: frontAuth,
    name: "newInboundMessage",
    displayName: "New Inbound Message",
    description: "Fires when a new message is received in a shared inbox.",
    props: {},
    sampleData: {
        "_links": {
            "self": "https://yourCompany.api.frontapp.com/messages/msg_1q15qmtq",
            "related": {
                "conversation": "https://yourCompany.api.frontapp.com/conversations/cnv_yo1kg5q",
                "message_replied_to": "https://yourCompany.api.frontapp.com/messages/msg_2y67qldq",
                "message_seen": "https://yourCompany.api.frontapp.com/messages/msg_1q15qmtq/seen"
            }
        },
        "id": "msg_1q15qmtq",
        "message_uid": "1eab543f84a0785f7b6b8967cck18f4d",
        "type": "email",
        "is_inbound": true,
        "draft_mode": "shared",
        "error_type": null,
        "version": "551ba368f3e7803cce51503ee3e58ef0-26028-1701804863304-945c",
        "created_at": 1701292639,
        "subject": "Jim's pranks are getting out of hand",
        "blurb": "It's high time we discuss the pranking culture in the office",
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
        "recipients": [
            {
                "_links": {
                    "related": {
                        "contact": "https://yourCompany.api.frontapp.com/contacts/crd_2njtoem"
                    }
                },
                "name": "Phyllis Lapin-Vance",
                "handle": "purpleboss@limitlesspaper.com",
                "role": "cc"
            }
        ],
        "body": "<p>Hi there,</p><p>I wanted to let you know that I'm suggesting an update to <a href='https://dundermifflin.com/privacy/pranks'>Dunder Mifflin's Pranking Policy</a> to provide non-humorous employees greater control over their well-being in the office.</p>",
        "text": "Hi there,\\n\\nI wanted to let you know that I'm suggesting an update to Dunder Mifflin's Pranking Policy (https://dundermifflin.com/privacy/pranks) to provide non-humorous employees greater control over their well-being in the office.",
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
        "signature": {
            "_links": {
                "self": "https://yourCompany.api.frontapp.com/signatures/sig_6rrv2",
                "related": {
                    "owner": "https://yourCompany.api.frontapp.com/teams/tim_k30"
                }
            },
            "id": "sig_6rrv2",
            "name": "Finer Things Club signature",
            "body": "<div>—<br />{{user.name}}<br />No paper, no plastic, and no work talk allowed<br /></div>",
            "sender_info": {
                "[object Object]": null
            },
            "is_visible_for_all_teammate_channels": true,
            "is_default": false,
            "is_private": true,
            "channel_ids": [
                null
            ]
        },
        "metadata": {
            "intercom_url": "http://intercom.com",
            "duration": 189,
            "have_been_answered": false,
            "external_id": "dkd84992kduo903",
            "twitter_url": "https://twitter.com",
            "is_retweet": true,
            "have_been_retweeted": true,
            "have_been_favorited": false,
            "thread_ref": "t0930k9000-394",
            "headers": {},
            "chat_visitor_url": "https://yourCompany.com/products"
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