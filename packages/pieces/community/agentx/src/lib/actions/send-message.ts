import { createAction, Property } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod } from "@activepieces/pieces-common";
import { agentxAuth } from "../common";

export const sendMessage = createAction({
    name: 'send_message_to_conversation',
    auth: agentxAuth,
    displayName: 'Send Message to Existing Conversation',
    description: 'Posts a message in an already active conversation.',
    props: {
        conversationId: Property.ShortText({
            displayName: 'Conversation ID',
            description: 'The ID of the conversation to post the message in.',
            required: true,
        }),
        message: Property.LongText({
            displayName: 'Message',
            description: 'The text message to send.',
            required: true,
        }),
        agentMode: Property.StaticDropdown({
            displayName: 'Agent Mode',
            description: 'The mode for the agent to use for this message.',
            required: true,
            options: {
                options: [
                    { label: 'Chat', value: 'chat' },
                    { label: 'Search', value: 'search' },
                ],
            },
        }),
        context: Property.Number({
            displayName: 'Memory Context',
            description: 'Memory context amount. 0 uses all history, 1 uses only the last message, etc. Leave blank for default.',
            required: false,
        }),
    },
    async run(context) {
        // FIX: The 'context' property is renamed to 'memoryContext' to avoid conflict
        const { conversationId, message, agentMode, context: memoryContext } = context.propsValue;
        const apiKey = context.auth;

        const requestBody: {
            agentMode: string;
            message: string;
            context?: number;
        } = {
            agentMode: agentMode,
            message: message,
        };

        // Only include the context in the body if the user has provided a value
        if (memoryContext !== undefined && memoryContext !== null) {
            requestBody.context = memoryContext;
        }

        const response = await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: `https://api.agentx.so/api/v1/access/conversations/${conversationId}/message`,
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
            },
            body: requestBody,
        });

        return response.body;
    },
});