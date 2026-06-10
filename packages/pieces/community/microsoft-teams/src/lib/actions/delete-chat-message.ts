import { microsoftTeamsAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { microsoftTeamsCommon } from '../common';
import { createGraphClient } from '../common/graph';

export const deleteChatMessageAction = createAction({
    auth: microsoftTeamsAuth,
    name: 'microsoft_teams_delete_chat_message',
    displayName: 'Delete Chat Message',
    description: 'Soft-Deletes a message in chat.You can only delete messages you sent.',
    audience: 'both',
    aiMetadata: {
        description: 'Soft-deletes a message in a Microsoft Teams chat, identified by chat ID and message ID, on behalf of the authenticated user. Only messages the current user sent can be deleted. Effectively idempotent — re-running on an already-deleted message leaves it deleted.',
        idempotent: true,
    },
    props: {
        chatId: microsoftTeamsCommon.chatId,
        messageId: Property.ShortText({
            displayName: 'Message ID',
            required: true,
            description: 'The ID of the message to delete.',
        }),
    },
    async run(context) {
        const { chatId, messageId } = context.propsValue;

        const cloud = context.auth.props?.['cloud'] as string | undefined;
        const client = createGraphClient(context.auth.access_token, cloud);
        

        const me = await client.api('/me').select('id,userPrincipalName').get();

        await client.api(`/users/${me.id}/chats/${chatId}/messages/${messageId}/softDelete`).post({});

        return {success:true,messageId,chatId}


    },
});


