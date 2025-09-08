import { createAction, Property } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod } from "@activepieces/pieces-common";
import { AgentXAuth } from "../common";


type Message = {
    text: string;
    [key: string]: unknown;
};


type ConversationDetail = {
    messages: Message[];
    [key: string]: unknown;
};

export const findMessage = createAction({
    name: 'find_message',
    auth: AgentXAuth,
    displayName: 'Find Message',
    description: 'Searches for specific messages within a conversation.',
    props: {
        agentId: Property.ShortText({
            displayName: 'Agent ID',
            description: 'The ID of the agent who owns the conversation.',
            required: true,
        }),
        conversationId: Property.ShortText({
            displayName: 'Conversation ID',
            description: 'The ID of the conversation to search within.',
            required: true,
        }),
        searchTerm: Property.ShortText({
            displayName: 'Search Term',
            description: 'The text to search for in the message content. Leave blank to get all messages.',
            required: false,
        })
    },
    async run(context) {
        const { agentId, conversationId, searchTerm } = context.propsValue;
        const apiKey = context.auth;

        const response = await httpClient.sendRequest<ConversationDetail>({
            method: HttpMethod.GET,
            url: `https://api.agentx.so/api/v1/access/agents/${agentId}/conversations/${conversationId}`,
            headers: {
                'x-api-key': apiKey,
            },
        });

        
        const allMessages = response.body.messages || [];

        if (!searchTerm) {
            return allMessages;
        }

        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        
        const filteredMessages = allMessages.filter(message =>
            message.text && message.text.toLowerCase().includes(lowerCaseSearchTerm)
        );

        return filteredMessages;
    },
});