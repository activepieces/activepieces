import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod, httpClient } from "@activepieces/pieces-common";
import { wonderchatAuth } from "../common/auth";

export const askQuestion = createAction({
    
    auth: wonderchatAuth,
    name: 'ask_question',
    displayName: 'Ask Question',
    description: "Send a question to your Wonderchat bot; returns the bot's answer.",
    props: {
        chatbotId: Property.ShortText({
            displayName: 'Chatbot ID',
            description: 'The ID of the chatbot you want to chat with.',
            required: true,
        }),
        question: Property.LongText({
            displayName: 'Question',
            description: 'The question you wish to ask your chatbot.',
            required: true,
        }),
        chatlogId: Property.ShortText({
            displayName: 'Chatlog ID',
            description: 'The ID of your current chat session for conversation continuity.',
            required: false,
        }),
        context: Property.LongText({
            displayName: 'Context',
            description: 'Additional custom context about the chat session (e.g., user information).',
            required: false,
        }),
        contextUrl: Property.ShortText({
            displayName: 'Context URL',
            description: 'URL of the page the user is on to provide additional context.',
            required: false,
        })
    },
    async run(context) {
        
        const { apiKey } = context.auth;

        
        const { chatbotId, question, chatlogId, context: customContext, contextUrl } = context.propsValue;

        
        const body = {
            apiKey,
            chatbotId,
            question,
            chatlogId,
            context: customContext,
            contextUrl
        };

        
        const response = await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: 'https://app.wonderchat.io/api/v1/chat',
            body: body,
        });

        
        return response.body;
    },
});
