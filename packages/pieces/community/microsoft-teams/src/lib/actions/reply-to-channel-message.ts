import { microsoftTeamsAuth } from '../../';
import { createAction, Property } from '@activepieces/pieces-framework';
import { Client } from '@microsoft/microsoft-graph-client';
import { microsoftTeamsCommon } from '../common';

export const replyToChannelMessageAction = createAction({
    auth: microsoftTeamsAuth,
    name: 'microsoft_teams_reply_to_channel_message',
    displayName: 'Reply to Channel Message',
    description: 'Send a reply to an existing message in a channel.',
    props: {
        teamId: microsoftTeamsCommon.teamId,
        channelId: microsoftTeamsCommon.channelId,
        messageId: microsoftTeamsCommon.messageId,
        content: Property.LongText({
            displayName: 'Content',
            description: 'The content of the reply message. Supports HTML.',
            required: true,
        }),
    },
    async run(context) {
        const { teamId, channelId, messageId, content } = context.propsValue;

        const client = Client.initWithMiddleware({
            authProvider: {
                getAccessToken: () => Promise.resolve(context.auth.access_token),
            },
        });

        const message = {
            body: {
                contentType: 'html',
                content: content,
            },
        };

        return await client.api(`/teams/${teamId}/channels/${channelId}/messages/${messageId}/replies`).post(message);
    },
});