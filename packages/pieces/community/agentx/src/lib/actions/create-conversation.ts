import { createAction, Property } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod } from "@activepieces/pieces-common";
import { AgentXAuth } from "../common";
import { agentIdDropdown } from "../common/props";

export const createConversation = createAction({
    name: 'create_conversation',
    auth: AgentXAuth,
    displayName: 'Create Conversation With Single Agent',
    description: 'Starts a new conversation session with an AgentX agent, with no existing context.',
    props: {
        agentId: agentIdDropdown,
        conversationType: Property.StaticDropdown({
            displayName: 'Conversation Type',
            description: 'The type of conversation to initiate.',
            required: true,
            options: {
                options: [
                    { label: 'Chat', value: 'chat' },
                    { label: 'Search', value: 'search' },
                    { label: 'E-commerce', value: 'ecommerce' },
                ],
            },
        }),
    },
    async run(context) {
        const { agentId, conversationType } = context.propsValue;
        const apiKey = context.auth;

        const response = await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: `https://api.agentx.so/api/v1/access/agents/${agentId}/conversations/new`,
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
            },
            body: {
                type: conversationType,
            },
        });

        // Returns the newly created conversation object
        return response.body;
    },
});
