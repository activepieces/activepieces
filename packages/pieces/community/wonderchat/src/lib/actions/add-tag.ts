import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod, httpClient } from "@activepieces/pieces-common";
import { wonderchatAuth } from "../common/auth";

export const addTag = createAction({
    // Use the shared authentication definition.
    auth: wonderchatAuth,
    name: 'add_tag',
    displayName: 'Add Tag',
    description: "Add custom tags to a specific chatlog.",
    props: {
        chatlogId: Property.ShortText({
            displayName: 'Chatlog ID',
            description: 'The ID of the chatlog to add tags to.',
            required: true,
        }),
        tags: Property.Array({
            displayName: 'Tags',
            description: 'The tags you want to add to the chatlog. Each tag should be on a new line.',
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

        // Send the HTTP POST request to the Wonderchat API.
        const response = await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: 'https://app.wonderchat.io/api/v1/add-tags-to-chatlog',
            body: body,
        });

        // Return the full response body from the API call.
        return response.body;
    },
});
