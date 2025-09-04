import { createAction,  Property } from "@activepieces/pieces-framework";
import { HttpMethod, httpClient } from "@activepieces/pieces-common";
import { wonderchatAuth } from "../common/auth";

export const removeTag = createAction({
    // Use the shared authentication definition.
    auth: wonderchatAuth,
    name: 'remove_tag',
    displayName: 'Remove Tag',
    description: "Remove specific tags from a chatlog.",
    props: {
        chatlogId: Property.ShortText({
            displayName: 'Chatlog ID',
            description: 'The ID of the chatlog to remove tags from.',
            required: true,
        }),
        tags: Property.Array({
            displayName: 'Tags',
            description: 'The tags you want to remove from the chatlog. Each tag should be on a new line.',
            required: true,
        }),
    },
    async run(context) {
        // Retrieve the API key from the authenticated connection.
        const { apiKey } = context.auth;

        // Retrieve properties provided by the user in the workflow step.
        const { chatlogId, tags } = context.propsValue;

        // Construct the request body according to the Wonderchat API documentation.
        const body = {
            apiKey,
            chatlogId,
            // The tags property is expected to be an array of strings.
            tags,
        };

        // Send the HTTP POST request to the Wonderchat API to delete tags.
        const response = await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: 'https://app.wonderchat.io/api/v1/delete-tags-from-chatlog',
            body: body,
        });

        // Return the full response body from the API call.
        return response.body;
    },
});
