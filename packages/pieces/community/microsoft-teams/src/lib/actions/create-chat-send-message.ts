import { microsoftTeamsAuth } from '../../';
import { createAction, Property } from '@activepieces/pieces-framework';
import { Client } from '@microsoft/microsoft-graph-client';
import { microsoftTeamsCommon } from '../common';
import { Chat } from '@microsoft/microsoft-graph-types';

export const createChatSendMessageAction = createAction({
    auth: microsoftTeamsAuth,
    name: 'microsoft_teams_create_chat_send_message',
    displayName: 'Create Chat & Send Message',
    description: 'Starts a new one-on-one chat and sends an initial message.',
    props: {
        userId: microsoftTeamsCommon.userId,
        content: Property.LongText({
            displayName: 'Message Content',
            description: 'The content of the initial message to send. Supports HTML.',
            required: true,
        }),
    },
    async run(context) {
        const { userId, content } = context.propsValue;

        const client = Client.initWithMiddleware({
            authProvider: {
                getAccessToken: () => Promise.resolve(context.auth.access_token),
            },
        });

        // Step 1: Create a new one-on-one chat
        const chatData = {
            chatType: 'oneOnOne',
            members: [
                {
                    '@odata.type': '#microsoft.graph.aadUserConversationMember',
                    roles: ['owner'],
                    'user@odata.bind': `https://graph.microsoft.com/v1.0/users('${userId}')`
                }
            ]
        };
        const newChat = await client.api('/chats').post(chatData) as Chat;
        const chatId = newChat.id;

        if (!chatId) {
            throw new Error('Failed to create the chat. Please check permissions.');
        }

        // Step 2: Send a message to the newly created chat
        const messageData = {
            body: {
                content: content,
                contentType: 'html',
            }
        };

        return await client.api(`/chats/${chatId}/messages`).post(messageData);
    },
});