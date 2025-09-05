import { microsoftTeamsAuth } from '../../';
import { createAction, Property } from '@activepieces/pieces-framework';
import { Client } from '@microsoft/microsoft-graph-client';
import { microsoftTeamsCommon } from '../common';

export const getChannelMessageAction = createAction({
    auth: microsoftTeamsAuth,
    name: 'microsoft_teams_get_channel_message',
    displayName: 'Get Channel Message',
    description: 'Fetches a specific message or a reply from a channel.',
    props: {
        teamId: microsoftTeamsCommon.teamId,
        channelId: microsoftTeamsCommon.channelId,
        messageId: microsoftTeamsCommon.messageId,
        replyId: Property.ShortText({
            displayName: 'Reply ID',
            description: 'If retrieving a reply, provide its ID. Otherwise, leave this empty.',
            required: false,
        }),
    },
    async run(context) {
        const { teamId, channelId, messageId, replyId } = context.propsValue;

        const client = Client.initWithMiddleware({
            authProvider: {
                getAccessToken: () => Promise.resolve(context.auth.access_token),
            },
        });

        let url = `/teams/${teamId}/channels/${channelId}/messages/${messageId}`;
        if (replyId) {
            url += `/replies/${replyId}`;
        }

        return await client.api(url).get();
    },
});