import { microsoftTeamsAuth } from '../../';
import { createAction, Property } from '@activepieces/pieces-framework';
import { Client } from '@microsoft/microsoft-graph-client';
import { microsoftTeamsCommon } from '../common';

export const createPrivateChannelAction = createAction({
    auth: microsoftTeamsAuth,
    name: 'microsoft_teams_create_private_channel',
    displayName: 'Create Private Channel',
    description: 'Creates a new private channel within a team.',
    props: {
        teamId: microsoftTeamsCommon.teamId,
        ownerId: microsoftTeamsCommon.channelOwnerId,
        channelDisplayName: Property.ShortText({
            displayName: 'Channel Name',
            description: 'The name of the new private channel (max 50 characters).',
            required: true,
        }),
        channelDescription: Property.LongText({
            displayName: 'Channel Description',
            description: 'An optional description for the private channel.',
            required: false,
        }),
    },
    async run(context) {
        const { teamId, ownerId, channelDisplayName, channelDescription } = context.propsValue;

        const client = Client.initWithMiddleware({
            authProvider: {
                getAccessToken: () => Promise.resolve(context.auth.access_token),
            },
        });

        const channelData = {
            '@odata.type': '#Microsoft.Graph.channel',
            membershipType: 'private',
            displayName: channelDisplayName,
            description: channelDescription,
            members: [
                {
                    '@odata.type': '#microsoft.graph.aadUserConversationMember',
                    'user@odata.bind': `https://graph.microsoft.com/v1.0/users('${ownerId}')`,
                    roles: ['owner']
                }
            ]
        };

        return await client.api(`/teams/${teamId}/channels`).post(channelData);
    },
});