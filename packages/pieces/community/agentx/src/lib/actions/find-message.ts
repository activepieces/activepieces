import { createAction, Property } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod } from "@activepieces/pieces-common";
import { agentxAuth } from "../common";

export const findMessage = createAction({
    name: 'find_message',
    auth: agentxAuth,
    displayName: 'Find Message',
    description: 'Gets the detailed trace information for a specific message by its ID.',
    props: {
        messageId: Property.ShortText({
            displayName: 'Message ID',
            description: 'The ID of the message to find.',
            required: true,
        }),
    },
    async run(context) {
        const { messageId } = context.propsValue;
        const apiKey = context.auth;

        // Step 1: Get the Trace ID from the Message ID
        const traceIdResponse = await httpClient.sendRequest<{ id: string }>({
            method: HttpMethod.GET,
            url: `https://api.agentx.so/api/v1/access/messages/${messageId}/trace`,
            headers: {
                'x-api-key': apiKey,
            },
        });

        const traceId = traceIdResponse.body.id;

        if (!traceId) {
            throw new Error(`Could not find a Trace ID for Message ID: ${messageId}`);
        }

        // Step 2: Use the Trace ID to get the detailed trace information
        const traceDetailsResponse = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: `https://api.agentx.so/api/v1/access/traces/${traceId}`,
            headers: {
                'x-api-key': apiKey,
            },
        });

        return traceDetailsResponse.body;
    },
});