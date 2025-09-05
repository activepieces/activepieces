import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { wonderchatAuth } from '../common/auth';
import { makeClient } from '../common/common';

export const newUserMessage = createTrigger({
    auth: wonderchatAuth,
    name: 'new_user_message',
    displayName: 'New User Message',
    description: 'Triggers when a new message is sent to the Wonderchat chatbot',
    props: {
        question: Property.LongText({
            displayName: 'Question',
            description: 'The question you wish to ask your chatbot',
            required: true,
        }),
        chatlogId: Property.ShortText({
            displayName: 'Chat Log ID',
            description: 'The ID of your current chat session for conversation continuity',
            required: false,
        }),
        context: Property.LongText({
            displayName: 'Context',
            description: 'Additional custom context about the chat session (e.g., user information)',
            required: false,
        }),
        contextUrl: Property.ShortText({
            displayName: 'Context URL',
            description: 'URL of the page the user is on to provide additional context',
            required: false,
        }),
    },
    sampleData: {
        response: "Hello there, how may I help you?",
        chatlogId: "cli7n0vvs000008l43ez2bxa0",
        sources: [
            {
                url: "https://www.yourwebsite.com/source1",
                title: "About Us"
            }
        ]
    },
    type: TriggerStrategy.WEBHOOK,
    async onEnable(context) {
        // Wonderchat doesn't require webhook registration for this trigger
        // The trigger will be activated when the chat endpoint is called
    },
    async onDisable(context) {
        // No cleanup needed for Wonderchat webhook
    },
    async run(context) {
        const { question, chatlogId, context: customContext, contextUrl } = context.propsValue;
        const { chatbotId } = context.auth;
        
        const client = makeClient(context.auth);
        
        // Prepare the request payload
        const request = {
            chatbotId,
            question,
            ...(chatlogId && { chatlogId }),
            ...(customContext && { context: customContext }),
            ...(contextUrl && { contextUrl }),
        };
        
        // Make the API call to Wonderchat
        const response = await client.sendMessage(request);
        
        return [response];
    }
});
