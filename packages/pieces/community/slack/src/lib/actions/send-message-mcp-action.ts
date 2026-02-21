import { createAction, Property } from '@activepieces/pieces-framework';
import { slackAuth } from '../../';
import { slackChannel } from '../common/props';
import { slackSendMessage } from '../common/utils';

export const slackSendMessageMcpAction = createAction({
    auth: slackAuth,
    name: 'send_message_mcp',
    displayName: 'Send Message (MCP)',
    description: 'Send a message to a Slack channel (Optimized for AI/MCP)',
    props: {
        channel: slackChannel(true),
        text: Property.LongText({
            displayName: 'Message',
            description: 'The text of your message',
            required: true,
        }),
        threadTs: Property.ShortText({
            displayName: 'Thread Timestamp',
            description: 'The timestamp of the thread to reply to',
            required: false,
        }),
    },
    async run(context) {
        const { channel, text, threadTs } = context.propsValue;
        return slackSendMessage({
            token: context.auth.access_token,
            text,
            conversationId: channel,
            threadTs: threadTs || undefined,
        });
    },
});
