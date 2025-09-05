import { microsoftTeamsAuth } from '../../';
import { createAction } from '@activepieces/pieces-framework';
import { Client } from '@microsoft/microsoft-graph-client';
import { microsoftTeamsCommon } from '../common';

export const getChatMessageAction = createAction({
    auth: microsoftTeamsAuth,
    name: 'microsoft_teams_get_chat_message',
    displayName: 'Get Chat Message',
    description: 'Fetches a specific message from a chat.',
    props: {
        chatId: microsoftTeamsCommon.chatId,
        messageId: microsoftTeamsCommon.chatMessageId,
    },
    async run(context) {
        const { chatId, messageId } = context.propsValue;

        const client = Client.initWithMiddleware({
            authProvider: {
                getAccessToken: () => Promise.resolve(context.auth.access_token),
            },
        });

        const url = `/chats/${chatId}/messages/${messageId}`;

        return await client.api(url).get();
    },
});