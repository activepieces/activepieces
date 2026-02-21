import { createAction, Property } from '@activepieces/pieces-framework';
import { slackAuth } from '../../';
import { slackChannel } from '../common/props';
import { WebClient } from '@slack/web-api';

export const slackListThreadsMcpAction = createAction({
    auth: slackAuth,
    name: 'list_threads_mcp',
    displayName: 'List Thread Messages (MCP)',
    description: 'Retrieve messages from a specific thread (Optimized for AI/MCP)',
    props: {
        channel: slackChannel(true),
        threadTs: Property.ShortText({
            displayName: 'Thread Timestamp',
            description: 'The timestamp of the thread to retrieve messages from',
            required: true,
        }),
    },
    async run(context) {
        const client = new WebClient(context.auth.access_token);
        return await client.conversations.replies({
            channel: context.propsValue.channel,
            ts: context.propsValue.threadTs,
        });
    },
});
