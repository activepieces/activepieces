import { createAction, Property } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod } from "@activepieces/pieces-common";
import { agentxAuth } from "../common";

export const findConversation = createAction({
    name: 'find_conversation',
    auth: agentxAuth,
    displayName: 'Find Conversation',
    description: 'Looks up existing conversations by Agent ID.',
    props: {
        agentId: Property.ShortText({
            displayName: 'Agent ID',
            description: 'The ID of the agent whose conversations you want to find.',
            required: true,
        }),
    },
    async run(context) {
        const { agentId } = context.propsValue;
        const apiKey = context.auth;

        const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: `https://api.agentx.so/api/v1/access/agents/${agentId}/conversations`,
            headers: {
                'x-api-key': apiKey,
            },
        });

        // Returns a list of conversations associated with the agent
        return response.body;
    },
});