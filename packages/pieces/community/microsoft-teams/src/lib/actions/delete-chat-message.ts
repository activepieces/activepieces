import { microsoftTeamsAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { microsoftTeamsProps } from '../common/props';
import { microsoftTeamsClient } from '../common/client';
import type { MicrosoftTeamsMe } from '../common/types';
import { microsoftTeamsDeleteChatMessageOutputSchema } from '../output-schemas';

export const deleteChatMessageAction = createAction({
    auth: microsoftTeamsAuth,
    name: 'microsoft_teams_delete_chat_message',
    outputSchema: microsoftTeamsDeleteChatMessageOutputSchema,
    classification: 'DESTRUCTIVE',
    displayName: 'Delete Chat Message',
    description: 'Soft-Deletes a message in chat.You can only delete messages you sent.',
    audience: 'human',
    aiMetadata: {
        description: 'Soft-deletes a message in a Microsoft Teams chat, identified by chat ID and message ID, on behalf of the authenticated user. Only messages the current user sent can be deleted. Effectively idempotent — re-running on an already-deleted message leaves it deleted.',
        idempotent: true,
    },
    props: {
        chatId: microsoftTeamsProps.chatId({ required: true }),
        messageId: Property.ShortText({
            displayName: 'Message ID',
            required: true,
            description: 'The ID of the message to delete.',
        }),
    },
    async run(context) {
        const { chatId, messageId } = context.propsValue;

        const client = microsoftTeamsClient.create({ auth: context.auth });
        

        const me: MicrosoftTeamsMe = await client.api('/me').select('id,userPrincipalName').get();

        await client.api(`/users/${me.id}/chats/${chatId}/messages/${messageId}/softDelete`).post({});

        return {success:true,messageId,chatId}


    },
});


