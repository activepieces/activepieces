import { microsoftTeamsAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { microsoftTeamsCommon } from '../common';
import { createGraphClient } from '../common/graph';

export const deleteChatMessageAction = createAction({
    auth: microsoftTeamsAuth,
    name: 'microsoft_teams_delete_chat_message',
    displayName: 'Delete Chat Message',
    description: 'Soft-Deletes a message in chat.You can only delete messages you sent.',
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


