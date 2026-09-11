import { createAction, Property } from '@activepieces/pieces-framework';
import { slackAuth } from '../auth';
import { WebClient } from '@slack/web-api';
import { singleSelectChannelInfo, slackChannel } from '../common/props';
import { processMessageTimestamp } from '../common/utils';
import { getBotToken, SlackAuthValue } from '../common/auth-helpers';
import { threadRepliesActionOutputSchema } from '../output-schemas';

export const retrieveThreadMessages = createAction({
  name: 'retrieveThreadMessages',
  classification: 'READ',
  displayName: 'Retrieve Thread Messages',
  description: 'Retrieves thread messages by channel and thread timestamp.',
  audience: 'human',
  aiMetadata: { description: 'Retrieve all replies in a thread given the channel and the parent message timestamp; read-only and repeatable. The timestamp must be that of the parent message, not a reply. Use this to read a conversation thread; use Get channel history for top-level channel messages.', idempotent: true },
  auth: slackAuth,
  outputSchema: threadRepliesActionOutputSchema,
  props: {
    info: singleSelectChannelInfo,
    channel: slackChannel(true),
    threadTs: Property.ShortText({
      displayName: 'Thread Timestamp',
      description: "Timestamp or link of the thread's parent message.",
      placeholder: '1710304378.475129',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const client = new WebClient(getBotToken(auth as SlackAuthValue));
    const messageTimestamp = processMessageTimestamp(propsValue.threadTs);
    if (!messageTimestamp) {
      throw new Error('Invalid Timestamp Value.');
    }

    const firstPage = await client.conversations.replies({
      channel: propsValue.channel,
      ts: messageTimestamp,
      limit: 200,
    });

    const messages = [...(firstPage.messages ?? [])];
    let cursor = firstPage.response_metadata?.next_cursor;

    while (cursor) {
      const page = await client.conversations.replies({
        channel: propsValue.channel,
        ts: messageTimestamp,
        limit: 200,
        cursor,
      });
      if (page.messages) {
        messages.push(...page.messages);
      }
      cursor = page.response_metadata?.next_cursor;
    }

    return { ...firstPage, messages, has_more: false };
  },
});
