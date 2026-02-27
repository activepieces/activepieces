import { createAction, Property } from '@activepieces/pieces-framework';
import { slackAuth } from '../../';
import { WebClient } from '@slack/web-api';

export const slackCreateChannelMcpAction = createAction({
    auth: slackAuth,
    name: 'create_channel_mcp',
    displayName: 'Create Channel (MCP)',
    description: 'Create a new Slack channel (Optimized for AI/MCP)',
    props: {
        name: Property.ShortText({
            displayName: 'Channel Name',
            description: 'The name of the channel to create',
            required: true,
        }),
        isPrivate: Property.Checkbox({
            displayName: 'Is Private?',
            description: 'Whether the channel should be private',
            required: false,
            defaultValue: false,
        }),
    },
    async run(context) {
        const client = new WebClient(context.auth.access_token);
        return await client.conversations.create({
            name: context.propsValue.name,
            is_private: context.propsValue.isPrivate,
        });
    },
});
