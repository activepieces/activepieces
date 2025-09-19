import { createAction, Property } from "@activepieces/pieces-framework";
import { makeRequest } from "../common/client";
import { HttpMethod } from "@activepieces/pieces-common";
import { frontAuth } from "../common/auth";

export const addConversationLinks = createAction({
    auth: frontAuth,
    name: "addConversationLinks",
    displayName: "Add Conversation Links",
    description: "Link external references (URLs) to a conversation.",
    props: {
        conversationId: Property.ShortText({
            displayName: "Conversation ID",
            description: "The conversation ID.",
            required: true,
        }),
        linkIds: Property.Array({
            displayName: "Link IDs",
            description: "Link IDs to add. Either link_ids or link_external_urls must be specified but not both.",
            required: false,
            properties: {
                linkId: Property.ShortText({
                    displayName: "Link ID",
                    description: "The ID of the link to add.",
                    required: true,
                }),
            }
        }),
        linkExternalUrls: Property.Array({
            displayName: "Link External URLs",
            description: "Link external URLs to add. Either link_ids or link_external_urls must be specified but not both.",
            required: false,
            properties: {
                linkExternalUrl: Property.ShortText({
                    displayName: "Link External URL",
                    description: "The external URL to add.",
                    required: true,
                }),
            }
        }),
    },
    async run({ auth, propsValue }) {
        if (!propsValue.linkIds && !propsValue.linkExternalUrls) {
            throw new Error("Either link_ids or link_external_urls must be specified but not both.");
        }

        if (propsValue.linkIds && propsValue.linkExternalUrls) {
            throw new Error("Either link_ids or link_external_urls must be specified but not both.");
        }

        return makeRequest(auth, HttpMethod.POST, `/conversations/${propsValue.conversationId}/links`, {
            link_ids: propsValue.linkIds,
            link_external_urls: propsValue.linkExternalUrls,
        });
    },
});
